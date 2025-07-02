package api

import (
	"beast-royale-backend/internal/db"
	"strconv"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/mitchellh/mapstructure"
)

func init() {
	Register(GET_USER_INFO_LABEL, NewGetUserInfoTask, COOKIEAUTH)
}

// GetUserInfoRequest 获取用户信息请求
type GetUserInfoRequest struct {
	BaseRequest
	Address string `mapstructure:"Address" validate:"required"`
}

// GetUserInfoResponse 获取用户信息响应
type GetUserInfoResponse struct {
	BaseResponse
	Address  string `json:"address"`
	Username string `json:"username"`
	Nonce    string `json:"nonce"`
}

// GetUserInfoTask 获取用户信息任务
type GetUserInfoTask struct {
	Request  *GetUserInfoRequest
	Response *GetUserInfoResponse
}

// NewGetUserInfoRequest 创建获取用户信息请求
func NewGetUserInfoRequest(data *map[string]interface{}) (*GetUserInfoRequest, error) {
	req := &GetUserInfoRequest{}
	err := mapstructure.Decode(*data, &req)
	if err != nil {
		return nil, err
	}
	req.BaseRequest.RequestUUID = (*data)["RequestUUID"].(string)
	return req, nil
}

// NewGetUserInfoResponse 创建获取用户信息响应
func NewGetUserInfoResponse(sessionId string) *GetUserInfoResponse {
	return &GetUserInfoResponse{
		BaseResponse: BaseResponse{
			Action:      GET_USER_INFO_LABEL + "Response",
			RequestUUID: sessionId,
			RetCode:     0,
		},
	}
}

// NewGetUserInfoTask 创建获取用户信息任务
func NewGetUserInfoTask(data *map[string]interface{}) (Task, error) {
	req, err := NewGetUserInfoRequest(data)
	if err != nil {
		return nil, err
	}

	task := &GetUserInfoTask{
		Request:  req,
		Response: NewGetUserInfoResponse(req.BaseRequest.RequestUUID),
	}

	validate := validator.New()
	err = validate.Struct(task.Request)
	if err != nil {
		return nil, err
	}

	return task, nil
}

// Run 执行获取用户信息任务
func (task *GetUserInfoTask) Run(c *gin.Context) (Response, error) {
	// 从session中获取地址（由AuthMiddleware设置）
	_params, _ := c.Get("params")
	params, ok := _params.(*map[string]interface{})
	if !ok {
		task.Response.SetRetCode(400)
		task.Response.SetMessage("Invalid session data")
		return task.Response, nil
	}

	address, ok := (*params)["Address"].(string)
	if !ok || address == "" {
		task.Response.SetRetCode(400)
		task.Response.SetMessage("Address not found in session")
		return task.Response, nil
	}

	// 从数据库获取用户档案
	profile, err := db.GetUserProfileByAddress(address)
	if err != nil {
		// 如果用户档案不存在，尝试创建基础档案
		err = db.EnsureUserProfileExists(address)
		if err != nil {
			task.Response.SetRetCode(500)
			task.Response.SetMessage("Failed to get or create user profile")
			return task.Response, nil
		}
		// 重新获取用户档案
		profile, err = db.GetUserProfileByAddress(address)
		if err != nil {
			task.Response.SetRetCode(500)
			task.Response.SetMessage("Failed to retrieve user profile")
			return task.Response, nil
		}
	}

	// 从Redis获取当前nonce（如果存在）
	session := sessions.Default(c)
	key := MakeAddrNonceKey(address)
	v := session.Get(key)

	var nonce string
	if v != nil {
		nonce = strconv.Itoa(v.(int))
	} else {
		nonce = "No active nonce"
	}

	task.Response.Address = profile.Address
	task.Response.Username = profile.Username
	task.Response.Nonce = nonce
	task.Response.SetMessage("User info retrieved successfully")
	return task.Response, nil
}
