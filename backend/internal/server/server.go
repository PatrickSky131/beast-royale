package server

import (
	"beast-royale-backend/handlers"
	"beast-royale-backend/internal/server/middleware"

	"github.com/gin-gonic/gin"
)

// Server HTTP服务器
type Server struct {
	router *gin.Engine
}

// New 创建新的服务器实例
func New() *Server {
	router := gin.Default()

	// 添加CORS中间件
	router.Use(middleware.CORSMiddleware())

	// 创建RPC处理器
	rpcHandler := handlers.NewRPCHandler()

	// 设置路由
	setupRoutes(router, rpcHandler)

	return &Server{
		router: router,
	}
}

// setupRoutes 设置路由
func setupRoutes(router *gin.Engine, rpcHandler *handlers.RPCHandler) {
	// 根路径 - API信息页面
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"name":        "Beast Royale Backend API",
			"version":     "1.0.0",
			"description": "Beast Royale游戏后端服务",
			"status":      "running",
			"endpoints": gin.H{
				"health": "/health",
				"rpc":    "/rpc",
				"wallet": gin.H{
					"connect": "/api/v1/wallet/connect",
					"verify":  "/api/v1/wallet/verify",
				},
			},
			"documentation": "请查看README.md了解详细API使用方法",
		})
	})

	// 健康检查（保持兼容性）
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Beast Royale Backend is running",
		})
	})

	// RPC端点
	router.POST("/rpc", rpcHandler.HandleRPC)

	// 兼容性端点（保持向后兼容）
	router.POST("/api/v1/wallet/connect", func(c *gin.Context) {
		// 直接调用钱包处理器
		walletHandler := handlers.NewWalletHandler()
		walletHandler.Connect(c)
	})

	router.POST("/api/v1/wallet/verify", func(c *gin.Context) {
		// 直接调用钱包处理器
		walletHandler := handlers.NewWalletHandler()
		walletHandler.Verify(c)
	})
}

// Run 启动服务器
func (s *Server) Run(addr string) error {
	return s.router.Run(addr)
}
