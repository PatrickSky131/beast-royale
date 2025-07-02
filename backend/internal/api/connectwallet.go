package api

import (
	"beast-royale-backend/internal/logger"
	"math/rand"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/mitchellh/mapstructure"
)

func init() {
	Register(CONNECT_WALLET_LABEL, NewConnectWalletTask, NOAUTH)
}

// ConnectWalletRequest 连接钱包请求
type ConnectWalletRequest struct {
	BaseRequest
	Address string `mapstructure:"Address" validate:"required"`
}

// ConnectWalletResponse 连接钱包响应
type ConnectWalletResponse struct {
	BaseResponse
	Nonce int `json:"nonce"`
}

// ConnectWalletTask 连接钱包任务
type ConnectWalletTask struct {
	Request  *ConnectWalletRequest
	Response *ConnectWalletResponse
}

// NewConnectWalletRequest 创建连接钱包请求
func NewConnectWalletRequest(data *map[string]interface{}) (*ConnectWalletRequest, error) {
	req := &ConnectWalletRequest{}
	err := mapstructure.Decode(*data, &req)
	if err != nil {
		return nil, err
	}
	req.BaseRequest.RequestUUID = (*data)["RequestUUID"].(string)
	return req, nil
}

// NewConnectWalletResponse 创建连接钱包响应
func NewConnectWalletResponse(sessionId string) *ConnectWalletResponse {
	return &ConnectWalletResponse{
		BaseResponse: BaseResponse{
			Action:      CONNECT_WALLET_LABEL + "Response",
			RequestUUID: sessionId,
			RetCode:     0,
		},
	}
}

// NewConnectWalletTask 创建连接钱包任务
func NewConnectWalletTask(data *map[string]interface{}) (Task, error) {
	req, err := NewConnectWalletRequest(data)
	if err != nil {
		return nil, err
	}

	task := &ConnectWalletTask{
		Request:  req,
		Response: NewConnectWalletResponse(req.BaseRequest.RequestUUID),
	}

	validate := validator.New()
	err = validate.Struct(task.Request)
	if err != nil {
		return nil, err
	}

	return task, nil
}

// Run 执行连接钱包任务
func (task *ConnectWalletTask) Run(c *gin.Context) (Response, error) {
	if task.Request.Address == "" {
		task.Response.SetRetCode(400)
		task.Response.SetMessage("Address is required")
		return task.Response, nil
	}

	// 生成随机nonce并存储到Redis
	session := sessions.Default(c)
	key := MakeAddrNonceKey(task.Request.Address)

	// 检查是否已有nonce
	v := session.Get(key)
	if v == nil {
		// 生成新的nonce
		r := rand.New(rand.NewSource(time.Now().UTC().UnixNano()))
		nonce := r.Intn(900000) + 100000 // 6位数字

		// 存储到Redis，设置TTL
		session.Set(key, nonce)
		err := session.Save()
		if err != nil {
			logger.Error("保存nonce到Redis失败: %v", err)
			task.Response.SetRetCode(500)
			task.Response.SetMessage("Failed to generate nonce")
			return task.Response, nil
		}

		task.Response.Nonce = nonce
		logger.Info("为用户 %s 生成新nonce: %d", task.Request.Address, nonce)
	} else {
		// 使用已有的nonce
		nonce := v.(int)
		task.Response.Nonce = nonce
		logger.Info("为用户 %s 使用已有nonce: %d", task.Request.Address, nonce)
	}

	task.Response.SetMessage("Wallet connected successfully")
	return task.Response, nil
}
