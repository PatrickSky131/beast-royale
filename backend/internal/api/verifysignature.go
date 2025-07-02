package api

import (
	"beast-royale-backend/internal/db"
	"beast-royale-backend/internal/logger"
	"beast-royale-backend/internal/wallet"
	"fmt"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/mitchellh/mapstructure"
)

func init() {
	Register(VERIFY_SIGNATURE_LABEL, NewVerifySignatureTask, NOAUTH)
}

// VerifySignatureRequest 验证签名请求
type VerifySignatureRequest struct {
	BaseRequest
	Address   string `mapstructure:"Address" validate:"required"`
	Signature string `mapstructure:"Signature" validate:"required"`
	Nonce     int    `mapstructure:"Nonce" validate:"required"`
}

// VerifySignatureResponse 验证签名响应
type VerifySignatureResponse struct {
	BaseResponse
	Token string `json:"token"`
}

// VerifySignatureTask 验证签名任务
type VerifySignatureTask struct {
	Request  *VerifySignatureRequest
	Response *VerifySignatureResponse
}

// NewVerifySignatureRequest 创建验证签名请求
func NewVerifySignatureRequest(data *map[string]interface{}) (*VerifySignatureRequest, error) {
	req := &VerifySignatureRequest{}
	err := mapstructure.Decode(*data, &req)
	if err != nil {
		return nil, err
	}
	req.BaseRequest.RequestUUID = (*data)["RequestUUID"].(string)
	return req, nil
}

// NewVerifySignatureResponse 创建验证签名响应
func NewVerifySignatureResponse(sessionId string) *VerifySignatureResponse {
	return &VerifySignatureResponse{
		BaseResponse: BaseResponse{
			Action:      VERIFY_SIGNATURE_LABEL + "Response",
			RequestUUID: sessionId,
			RetCode:     0,
		},
	}
}

// NewVerifySignatureTask 创建验证签名任务
func NewVerifySignatureTask(data *map[string]interface{}) (Task, error) {
	req, err := NewVerifySignatureRequest(data)
	if err != nil {
		return nil, err
	}

	task := &VerifySignatureTask{
		Request:  req,
		Response: NewVerifySignatureResponse(req.BaseRequest.RequestUUID),
	}

	validate := validator.New()
	err = validate.Struct(task.Request)
	if err != nil {
		return nil, err
	}

	return task, nil
}

// Run 执行验证签名任务
func (task *VerifySignatureTask) Run(c *gin.Context) (Response, error) {
	if task.Request.Address == "" || task.Request.Signature == "" || task.Request.Nonce == 0 {
		task.Response.SetRetCode(400)
		task.Response.SetMessage("Address, Signature, and Nonce are required")
		return task.Response, nil
	}

	// 从Redis验证nonce
	session := sessions.Default(c)
	key := MakeAddrNonceKey(task.Request.Address)
	v := session.Get(key)
	if v == nil {
		logger.Error("用户 %s 的nonce不存在或已过期", task.Request.Address)
		task.Response.SetRetCode(401)
		task.Response.SetMessage("Nonce not found or expired")
		return task.Response, nil
	}

	storedNonce := v.(int)
	if storedNonce != task.Request.Nonce {
		logger.Error("用户 %s 的nonce不匹配: 期望 %d, 实际 %d", task.Request.Address, storedNonce, task.Request.Nonce)
		task.Response.SetRetCode(401)
		task.Response.SetMessage("Invalid nonce")
		return task.Response, nil
	}

	// 构造签名验证消息
	message := constructSignMessage(task.Request.Address, task.Request.Nonce)

	// 验证签名
	valid, err := verifySignature(message, task.Request.Signature, task.Request.Address)
	if err != nil {
		logger.Error("验证签名失败: %v", err)
		task.Response.SetRetCode(401)
		task.Response.SetMessage("Signature verification failed")
		return task.Response, nil
	}

	if !valid {
		task.Response.SetRetCode(401)
		task.Response.SetMessage("Invalid signature")
		return task.Response, nil
	}

	// 验证成功后，删除nonce（一次性使用）
	session.Delete(key)
	session.Save()

	// 设置Redis session用于后续认证
	// 使用gin-sessions的标准方式，将地址存储在session中
	logger.Info("准备保存session: 地址=%s", task.Request.Address)
	session.Set("address", task.Request.Address)
	err = session.Save()
	if err != nil {
		logger.Error("保存session失败: %v", err)
	} else {
		logger.Info("保存session成功: 地址=%s", task.Request.Address)
	}

	// 登录成功后，确保用户档案存在
	err = db.EnsureUserProfileExists(task.Request.Address)
	if err != nil {
		logger.Error("确保用户档案存在失败: %v", err)
		// 不返回错误，因为登录已经成功，档案创建失败不应该影响登录流程
	} else {
		logger.Info("用户档案创建/确认成功: %s", task.Request.Address)
	}

	// 生成token
	token := "valid_token_" + task.Request.Address
	task.Response.Token = token
	task.Response.SetMessage("Signature verified successfully")
	return task.Response, nil
}

// constructSignMessage 构造签名消息
func constructSignMessage(address string, nonce int) string {
	// 使用与前端一致的签名模板，使用实际的换行符
	return fmt.Sprintf("连接Beast Royale游戏\n\n点击签名以验证您的身份。\n\nNonce: %d", nonce)
}

// verifySignature 验证以太坊签名
func verifySignature(message string, signature string, address string) (bool, error) {
	// 使用钱包服务验证签名
	walletService := wallet.NewWalletService()
	return walletService.VerifySignature(address, signature, message)
}
