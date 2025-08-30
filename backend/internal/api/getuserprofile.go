package api

import (
	"beast-royale-backend/internal/db"
	"beast-royale-backend/internal/logger"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/mitchellh/mapstructure"
)

func init() {
	Register(GET_USER_PROFILE_LABEL, NewGetUserProfileTask, COOKIEAUTH)
}

// GetUserProfileRequest 获取用户档案请求
type GetUserProfileRequest struct {
	BaseRequest
}

// GetUserProfileResponse 获取用户档案响应
type GetUserProfileResponse struct {
	BaseResponse
	Address            string `json:"address"`
	Username           string `json:"username"`
	Bio                string `json:"bio"`
	AvatarURL          string `json:"avatar_url"`
	DiscordURL         string `json:"discord_url"`
	DiscordUsername    string `json:"discord_username"`
	XURL               string `json:"x_url"`
	XUsername          string `json:"x_username"`
	Points             int64  `json:"points"`
	Tokens             int64  `json:"tokens"`
	CreatedAt          string `json:"created_at"`
	UpdatedAt          string `json:"updated_at"`
	LastUsernameUpdate string `json:"last_username_update"`
}

// GetUserProfileTask 获取用户档案任务
type GetUserProfileTask struct {
	Request  *GetUserProfileRequest
	Response *GetUserProfileResponse
}

// NewGetUserProfileRequest 创建获取用户档案请求
func NewGetUserProfileRequest(data *map[string]interface{}) (*GetUserProfileRequest, error) {
	req := &GetUserProfileRequest{}
	err := mapstructure.Decode(*data, &req)
	if err != nil {
		return nil, err
	}
	req.BaseRequest.RequestUUID = (*data)["RequestUUID"].(string)
	return req, nil
}

// NewGetUserProfileResponse 创建获取用户档案响应
func NewGetUserProfileResponse(sessionId string) *GetUserProfileResponse {
	return &GetUserProfileResponse{
		BaseResponse: BaseResponse{
			Action:      GET_USER_PROFILE_LABEL + "Response",
			RequestUUID: sessionId,
			RetCode:     0,
		},
	}
}

// NewGetUserProfileTask 创建获取用户档案任务
func NewGetUserProfileTask(data *map[string]interface{}) (Task, error) {
	req, err := NewGetUserProfileRequest(data)
	if err != nil {
		return nil, err
	}

	task := &GetUserProfileTask{
		Request:  req,
		Response: NewGetUserProfileResponse(req.BaseRequest.RequestUUID),
	}

	validate := validator.New()
	err = validate.Struct(task.Request)
	if err != nil {
		return nil, err
	}

	return task, nil
}

// Run 执行获取用户档案任务
func (task *GetUserProfileTask) Run(c *gin.Context) (Response, error) {
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
		logger.Error("获取用户档案失败: %v", err)
		task.Response.SetRetCode(500)
		task.Response.SetMessage("Failed to get user profile")
		return task.Response, nil
	}

	// 填充响应数据
	task.Response.Address = profile.Address
	task.Response.Username = profile.Username
	task.Response.Bio = profile.Bio
	task.Response.AvatarURL = profile.AvatarURL
	task.Response.DiscordURL = profile.DiscordURL
	task.Response.DiscordUsername = profile.DiscordUsername
	task.Response.XURL = profile.XURL
	task.Response.XUsername = profile.XUsername
	task.Response.Points = profile.Points
	task.Response.Tokens = profile.Tokens
	task.Response.CreatedAt = profile.CreatedAt.Format("2006-01-02 15:04:05")
	task.Response.UpdatedAt = profile.UpdatedAt.Format("2006-01-02 15:04:05")

	// 处理LastUsernameUpdate字段
	if profile.LastUsernameUpdate == nil || profile.LastUsernameUpdate.IsZero() {
		task.Response.LastUsernameUpdate = ""
	} else {
		task.Response.LastUsernameUpdate = profile.LastUsernameUpdate.Format("2006-01-02 15:04:05")
	}

	task.Response.SetMessage("User profile retrieved successfully")
	return task.Response, nil
}
