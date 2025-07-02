package middleware

import (
	"beast-royale-backend/internal/api"
	"beast-royale-backend/internal/logger"
	"net/http"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware 身份验证中间件 - 支持Action-based AuthType和Redis session
func AuthMiddleware(cookieName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 对于某些不需要认证的端点，直接放行
		if isPublicEndpoint(c.Request.URL.Path) {
			c.Next()
			return
		}

		// 获取action和params（用于Action-based认证）
		action := c.GetString("action")
		_params, _ := c.Get("params")
		params, ok := _params.(*map[string]interface{})

		// 如果是Action-based API，使用AuthType判断
		if action != "" && ok {
			authType := api.GetActionAuthType(action)

			switch authType {
			case api.NOAUTH:
				// 无需认证，直接放行
				c.Next()
				return
			case api.COOKIEAUTH:
				// 基于cookie-session的认证
				if handleCookieAuth(c, params, cookieName) {
					c.Next()
					return
				}
				// 认证失败，返回401
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"RetCode": 401,
					"Message": "Authentication required",
					"Error":   "Session not found or expired",
				})
				return
			case api.VERIFYAUTH:
				// 基于签名的认证（保持现有逻辑）
				if handleTokenAuth(c) {
					c.Next()
					return
				}
				// 认证失败，返回401
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"RetCode": 401,
					"Message": "Authentication required",
					"Error":   "Invalid signature or token",
				})
				return
			}
		}

		// 对于非Action-based API，使用传统的token认证
		if handleTokenAuth(c) {
			c.Next()
			return
		}

		// 认证失败
		logger.Error("认证失败 - Path: %s, Client: %s", c.Request.URL.Path, c.ClientIP())
		c.JSON(http.StatusUnauthorized, gin.H{
			"Success": false,
			"Message": "Unauthorized",
			"Error":   "Authentication required",
		})
		c.Abort()
	}
}

// handleCookieAuth 处理基于cookie-session的认证
func handleCookieAuth(c *gin.Context, params *map[string]interface{}, cookieName string) bool {
	// 检查cookie是否存在（gin-sessions会自动处理session ID）
	session := sessions.Default(c)

	// 从session中获取地址
	addr := session.Get("address")
	if addr == nil {
		logger.Error("Session not found or expired")
		return false
	}

	// 将session中的地址写入params，替代请求中的Address
	(*params)["Address"] = addr.(string)
	logger.Info("Cookie auth successful for address: %s", addr.(string))
	return true
}

// handleTokenAuth 处理基于token的认证
func handleTokenAuth(c *gin.Context) bool {
	// 获取Authorization头
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		// 对于API请求，检查是否有token参数
		token := c.Query("token")
		if token == "" {
			// 尝试从请求体中获取token
			var reqBody map[string]interface{}
			if err := c.ShouldBindJSON(&reqBody); err == nil {
				if tokenVal, ok := reqBody["token"].(string); ok && tokenVal != "" {
					token = tokenVal
				}
			}
		}

		if token != "" {
			// 验证token
			if isValidToken(token) {
				c.Set("UserToken", token)
				return true
			}
		}
		return false
	}

	// 处理Bearer token
	if strings.HasPrefix(authHeader, "Bearer ") {
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if isValidToken(token) {
			c.Set("UserToken", token)
			return true
		}
	}

	return false
}

// isPublicEndpoint 检查是否为公开端点
func isPublicEndpoint(path string) bool {
	publicPaths := []string{
		"/",
		"/health",
		"/api/v1/wallet/connect",
		"/api/v1/wallet/verify",
	}

	for _, publicPath := range publicPaths {
		if path == publicPath {
			return true
		}
	}

	return false
}

// isValidToken 验证token是否有效
func isValidToken(token string) bool {
	// 这里应该实现真正的token验证逻辑
	// 目前简单检查token格式
	if token == "" {
		return false
	}

	// 检查是否是有效的token格式（这里简化处理）
	if strings.HasPrefix(token, "valid_token_") {
		return true
	}

	return false
}
