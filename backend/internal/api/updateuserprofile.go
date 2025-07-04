package api

import (
	"beast-royale-backend/internal/db"
	"beast-royale-backend/internal/logger"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/mitchellh/mapstructure"
)

func init() {
	Register(UPDATE_USER_PROFILE_LABEL, NewUpdateUserProfileTask, COOKIEAUTH)
}

// UpdateUserProfileRequest 更新用户档案请求
type UpdateUserProfileRequest struct {
	BaseRequest
	Username        string `mapstructure:"Username" validate:"omitempty,min=3,max=20"`
	Bio             string `mapstructure:"Bio" validate:"omitempty,max=500"`
	AvatarURL       string `mapstructure:"AvatarURL" validate:"omitempty,max=50"`
	DiscordURL      string `mapstructure:"DiscordURL" validate:"omitempty,max=100"`
	DiscordUsername string `mapstructure:"DiscordUsername" validate:"omitempty,max=50"`
	XURL            string `mapstructure:"XURL" validate:"omitempty,max=100"`
	XUsername       string `mapstructure:"XUsername" validate:"omitempty,max=50"`
}

// UpdateUserProfileResponse 更新用户档案响应
type UpdateUserProfileResponse struct {
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
	UsernameUpdated    bool   `json:"username_updated"` // 标识用户名是否更新
}

// UpdateUserProfileTask 更新用户档案任务
type UpdateUserProfileTask struct {
	Request  *UpdateUserProfileRequest
	Response *UpdateUserProfileResponse
}

// NewUpdateUserProfileRequest 创建更新用户档案请求
func NewUpdateUserProfileRequest(data *map[string]interface{}) (*UpdateUserProfileRequest, error) {
	req := &UpdateUserProfileRequest{}
	err := mapstructure.Decode(*data, &req)
	if err != nil {
		return nil, err
	}
	req.BaseRequest.RequestUUID = (*data)["RequestUUID"].(string)
	return req, nil
}

// NewUpdateUserProfileResponse 创建更新用户档案响应
func NewUpdateUserProfileResponse(sessionId string) *UpdateUserProfileResponse {
	return &UpdateUserProfileResponse{
		BaseResponse: BaseResponse{
			Action:      UPDATE_USER_PROFILE_LABEL + "Response",
			RequestUUID: sessionId,
			RetCode:     0,
		},
	}
}

// NewUpdateUserProfileTask 创建更新用户档案任务
func NewUpdateUserProfileTask(data *map[string]interface{}) (Task, error) {
	req, err := NewUpdateUserProfileRequest(data)
	if err != nil {
		return nil, err
	}

	task := &UpdateUserProfileTask{
		Request:  req,
		Response: NewUpdateUserProfileResponse(req.BaseRequest.RequestUUID),
	}

	validate := validator.New()
	err = validate.Struct(task.Request)
	if err != nil {
		return nil, err
	}

	return task, nil
}

// Run 执行更新用户档案任务
func (task *UpdateUserProfileTask) Run(c *gin.Context) (Response, error) {
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

	// 检查用户名修改权限
	usernameUpdated := false
	attemptingUsernameUpdate := false // 后端自动判断是否尝试修改用户名

	// 判断用户是否尝试修改用户名
	if task.Request.Username != "" && task.Request.Username != profile.Username {
		attemptingUsernameUpdate = true

		// 检查用户名是否已被其他用户使用
		existingProfile, err := db.GetUserProfileByUsername(task.Request.Username)
		if err == nil && existingProfile != nil && existingProfile.Address != address {
			task.Response.SetRetCode(400)
			task.Response.SetMessage("Username already taken")
			return task.Response, nil
		}

		// 检查是否可以修改用户名（24小时内只能修改一次）
		if !profile.LastUsernameUpdate.IsZero() {
			timeSinceLastUpdate := time.Since(profile.LastUsernameUpdate)
			if timeSinceLastUpdate < 24*time.Hour {
				// 用户名不能更新，但继续更新其他字段
				logger.Info("用户名 %s 在24小时内不能更新，跳过用户名字段", address)
			} else {
				// 可以更新用户名
				profile.Username = task.Request.Username
				profile.LastUsernameUpdate = time.Now()
				usernameUpdated = true
			}
		} else {
			// 从未更新过用户名，可以更新
			profile.Username = task.Request.Username
			profile.LastUsernameUpdate = time.Now()
			usernameUpdated = true
		}
	}

	// 更新其他字段
	if task.Request.Bio != "" {
		profile.Bio = task.Request.Bio
	}
	if task.Request.AvatarURL != "" {
		profile.AvatarURL = task.Request.AvatarURL
	}
	if task.Request.DiscordURL != "" {
		profile.DiscordURL = task.Request.DiscordURL
	}
	if task.Request.DiscordUsername != "" {
		profile.DiscordUsername = task.Request.DiscordUsername
	}
	if task.Request.XURL != "" {
		profile.XURL = task.Request.XURL
	}
	if task.Request.XUsername != "" {
		profile.XUsername = task.Request.XUsername
	}

	// 保存到数据库
	err = db.UpdateUserProfile(profile)
	if err != nil {
		logger.Error("更新用户档案失败: %v", err)
		task.Response.SetRetCode(500)
		task.Response.SetMessage("Failed to update user profile")
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
	if profile.LastUsernameUpdate.IsZero() {
		task.Response.LastUsernameUpdate = ""
	} else {
		task.Response.LastUsernameUpdate = profile.LastUsernameUpdate.Format("2006-01-02 15:04:05")
	}

	// 设置用户名更新状态
	task.Response.UsernameUpdated = usernameUpdated

	// 根据用户名是否更新设置不同的返回码和消息
	if usernameUpdated {
		task.Response.SetRetCode(0) // 完全成功：所有字段都更新成功
		task.Response.SetMessage("User profile updated successfully")
	} else if attemptingUsernameUpdate && !usernameUpdated {
		// 部分成功：尝试更新用户名但被限制，其他字段更新成功
		task.Response.SetRetCode(206) // 206 Partial Content - 部分成功
		task.Response.SetMessage("User profile updated successfully")
	} else {
		// 完全成功：只更新了其他字段，没有尝试更新用户名
		task.Response.SetRetCode(0) // 完全成功
		task.Response.SetMessage("User profile updated successfully")
	}
	return task.Response, nil
}
