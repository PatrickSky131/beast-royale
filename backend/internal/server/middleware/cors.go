package middleware

import (
	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"
)

// CORSMiddleware 配置CORS中间件
func CORSMiddleware() gin.HandlerFunc {
	return cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // 允许所有来源，包括手机
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: false, // 当使用 * 时，必须设置为 false
	})
}
