package api

import (
	"beast-royale-backend/internal/logger"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/mitchellh/mapstructure"
)

func init() {
	Register("Logout", NewLogoutTask, NOAUTH)
}

// LogoutRequest 退出登录请求
type LogoutRequest struct {
	BaseRequest
}

// LogoutResponse 退出登录响应
type LogoutResponse struct {
	BaseResponse
}

// LogoutTask 退出登录任务
type LogoutTask struct {
	Request  *LogoutRequest
	Response *LogoutResponse
}

// NewLogoutRequest 创建退出登录请求
func NewLogoutRequest(data *map[string]interface{}) (*LogoutRequest, error) {
	req := &LogoutRequest{}
	err := mapstructure.Decode(*data, &req)
	if err != nil {
		return nil, err
	}
	req.BaseRequest.RequestUUID = (*data)["RequestUUID"].(string)
	return req, nil
}

// NewLogoutResponse 创建退出登录响应
func NewLogoutResponse(sessionId string) *LogoutResponse {
	return &LogoutResponse{
		BaseResponse: BaseResponse{
			Action:      "LogoutResponse",
			RequestUUID: sessionId,
			RetCode:     0,
		},
	}
}

// NewLogoutTask 创建退出登录任务
func NewLogoutTask(data *map[string]interface{}) (Task, error) {
	req, err := NewLogoutRequest(data)
	if err != nil {
		return nil, err
	}

	task := &LogoutTask{
		Request:  req,
		Response: NewLogoutResponse(req.BaseRequest.RequestUUID),
	}

	return task, nil
}

// Run 执行退出登录任务
func (task *LogoutTask) Run(c *gin.Context) (Response, error) {
	// 获取当前session
	session := sessions.Default(c)

	// 获取当前登录的地址（用于日志记录）
	addr := session.Get("address")
	address := ""
	if addr != nil {
		address = addr.(string)
		logger.Info("用户 %s 正在退出登录", address)
	}

	// 清除session中的所有数据
	session.Clear()

	// 保存session（这会删除Redis中的session数据）
	err := session.Save()
	if err != nil {
		logger.Error("清除session失败: %v", err)
		task.Response.SetRetCode(500)
		task.Response.SetMessage("Failed to logout")
		return task.Response, nil
	}

	logger.Info("用户 %s 退出登录成功", address)
	task.Response.SetMessage("Logout successful")
	return task.Response, nil
}
