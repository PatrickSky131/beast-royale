package cmd

import (
	"os"

	"beast-royale-backend/internal/db"
	"beast-royale-backend/internal/logger"
	"beast-royale-backend/internal/server"

	"github.com/joho/godotenv"
)

// Execute 启动应用程序
func Execute() {
	// 初始化日志系统
	if err := logger.Init(); err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}

	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		logger.Info("No .env file found, using system environment variables")
	}

	// 初始化数据库
	if err := db.Init(); err != nil {
		logger.Error("Failed to initialize database: %v", err)
		os.Exit(1)
	}

	// 获取端口配置
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 启动服务器
	srv := server.New()
	logger.Info("Server starting on port %s", port)
	if err := srv.Run(":" + port); err != nil {
		logger.Error("Failed to start server: %v", err)
		os.Exit(1)
	}
}
