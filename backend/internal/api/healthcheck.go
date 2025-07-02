package api

import (
	"github.com/gin-gonic/gin"
	"github.com/mitchellh/mapstructure"
)

func init() {
	Register(HEALTH_CHECK_LABEL, NewHealthCheckTask, NOAUTH)
}

// HealthCheckRequest 健康检查请求
type HealthCheckRequest struct {
	BaseRequest
}

// HealthCheckResponse 健康检查响应
type HealthCheckResponse struct {
	BaseResponse
	Status  string `json:"status"`
	Version string `json:"version"`
}

// HealthCheckTask 健康检查任务
type HealthCheckTask struct {
	Request  *HealthCheckRequest
	Response *HealthCheckResponse
}

// NewHealthCheckRequest 创建健康检查请求
func NewHealthCheckRequest(data *map[string]interface{}) (*HealthCheckRequest, error) {
	req := &HealthCheckRequest{}
	err := mapstructure.Decode(*data, &req)
	if err != nil {
		return nil, err
	}
	req.BaseRequest.RequestUUID = (*data)["RequestUUID"].(string)
	return req, nil
}

// NewHealthCheckResponse 创建健康检查响应
func NewHealthCheckResponse(sessionId string) *HealthCheckResponse {
	return &HealthCheckResponse{
		BaseResponse: BaseResponse{
			Action:      HEALTH_CHECK_LABEL + "Response",
			RequestUUID: sessionId,
			RetCode:     0,
		},
	}
}

// NewHealthCheckTask 创建健康检查任务
func NewHealthCheckTask(data *map[string]interface{}) (Task, error) {
	req, err := NewHealthCheckRequest(data)
	if err != nil {
		return nil, err
	}

	task := &HealthCheckTask{
		Request:  req,
		Response: NewHealthCheckResponse(req.BaseRequest.RequestUUID),
	}

	return task, nil
}

// Run 执行健康检查任务
func (task *HealthCheckTask) Run(c *gin.Context) (Response, error) {
	task.Response.Status = "healthy"
	task.Response.Version = "1.0.0"
	task.Response.SetMessage("Service is running")
	return task.Response, nil
}
