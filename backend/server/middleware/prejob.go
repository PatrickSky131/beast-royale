package middleware

import (
	"beast-royale-backend/internal/config"
	"beast-royale-backend/internal/logger"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PreJobMiddleware 请求预处理中间件
func PreJobMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 记录请求开始时间
		start := time.Now()

		// 设置请求ID
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}
		c.Set("RequestID", requestID)

		// 设置配置信息到context，供后续Task使用
		c.Set("cookie_name", cfg.Security.CookieName)
		c.Set("session_timeout", cfg.Security.SessionTimeout)

		// 解析Action-based API请求
		if c.Request.URL.Path == "/api" {
			// 解析JSON
			var requestData map[string]interface{}
			if err := c.ShouldBindJSON(&requestData); err != nil {
				logger.Error("解析JSON失败: %v", err)
				c.JSON(400, gin.H{
					"Success": false,
					"Message": "Invalid JSON format",
					"Error":   err.Error(),
				})
				c.Abort()
				return
			}

			// 提取action
			action, ok := requestData["Action"].(string)
			if !ok || action == "" {
				logger.Error("缺少Action字段")
				c.JSON(400, gin.H{
					"Success": false,
					"Message": "Action field is required",
					"Error":   "Missing Action field",
				})
				c.Abort()
				return
			}

			// 检查/生成 RequestUUID
			reqUUID, ok := requestData["RequestUUID"].(string)
			if !ok || reqUUID == "" {
				reqUUID = uuid.NewString()
				requestData["RequestUUID"] = reqUUID
				logger.Info("自动生成RequestUUID: %s", reqUUID)
			}

			// 设置action、params和RequestUUID到context
			c.Set("action", action)
			c.Set("params", &requestData)
			c.Set("RequestUUID", reqUUID)

			logger.Info("解析Action请求 - Action: %s, RequestUUID: %s, RequestID: %s", action, reqUUID, requestID)
		}

		// 记录请求信息
		logger.Info("收到请求 - Method: %s, Path: %s, Client: %s, RequestID: %s",
			c.Request.Method, c.Request.URL.Path, c.ClientIP(), requestID)

		// 设置响应头
		c.Header("X-Request-ID", requestID)
		c.Header("X-Response-Time", time.Since(start).String())

		// 继续处理请求
		c.Next()

		// 记录响应信息
		logger.Info("请求完成 - Method: %s, Path: %s, Status: %d, Duration: %v, RequestID: %s",
			c.Request.Method, c.Request.URL.Path, c.Writer.Status(), time.Since(start), requestID)
	}
}

// generateRequestID 生成请求ID
func generateRequestID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

// randomString 生成随机字符串
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}
