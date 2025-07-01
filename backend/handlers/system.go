package handlers

import (
	"github.com/gin-gonic/gin"
)

// SystemHandler 系统处理器
type SystemHandler struct{}

// NewSystemHandler 创建新的系统处理器
func NewSystemHandler() *SystemHandler {
	return &SystemHandler{}
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// Health 健康检查RPC方法
func (h *SystemHandler) Health(c *gin.Context) {
	c.JSON(200, HealthResponse{
		Status:  "ok",
		Message: "Beast Royale Backend is running",
	})
}
