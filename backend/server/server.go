package server

import (
	"context"
	"io"
	"net/http"
	"path"
	"strings"
	"sync"
	"time"

	"beast-royale-backend/internal/config"
	"beast-royale-backend/internal/handle"
	"beast-royale-backend/internal/logger"
	"beast-royale-backend/server/middleware"

	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/redis"
	"github.com/gin-gonic/gin"
	rotatelogs "github.com/lestrrat/go-file-rotatelogs"
)

type BeastRoyaleServer struct {
	e      *gin.Engine
	server *http.Server
	wg     *sync.WaitGroup
	config *config.Config
}

func NewServer(cfg *config.Config) *BeastRoyaleServer {
	wg := &sync.WaitGroup{}
	r := NewRouter(wg, cfg)
	return &BeastRoyaleServer{
		e:      r,
		wg:     wg,
		config: cfg,
	}
}

func (s *BeastRoyaleServer) Run() error {
	addr := s.config.GetServerAddr()
	s.server = &http.Server{
		Addr:    addr,
		Handler: s.e,
	}

	logger.Info("服务器启动在地址: %s", addr)
	return s.server.ListenAndServe()
}

func (s *BeastRoyaleServer) Stop() error {
	logger.Info("正在关闭服务器...")
	err := s.server.Shutdown(context.Background())
	// whether the err is nil, we should wait for wait group
	s.wg.Wait()
	logger.Info("服务器已关闭")
	return err
}

func NewRouter(wg *sync.WaitGroup, cfg *config.Config) *gin.Engine {
	// 设置Gin模式
	mode := strings.ToLower(getEnv("GIN_MODE", "debug"))
	switch mode {
	case "release":
		gin.SetMode(gin.ReleaseMode)
	case "debug":
		gin.SetMode(gin.DebugMode)
	case "test":
		gin.SetMode(gin.TestMode)
	default:
		gin.SetMode(gin.DebugMode)
	}

	r := gin.New()
	r.Use(ginLogger())
	r.Use(gin.Recovery())
	r.Use(ginWaitGroup(wg))
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	r.Use(middleware.CORSMiddleware())

	// 使用配置文件初始化Redis session store
	redisAddr := cfg.GetRedisAddr()
	redisPassword := cfg.Redis.Password
	redisSecret := cfg.Security.SessionSecret

	store, err := redis.NewStore(
		cfg.Redis.PoolSize,
		"tcp",
		redisAddr,
		"",
		redisPassword,
		[]byte(redisSecret),
	)
	if err != nil {
		logger.Error("Failed to initialize Redis session store: %v", err)
		panic("Redis session store is required for authentication")
	}

	// 设置session TTL为配置文件中的值
	store.Options(sessions.Options{
		MaxAge:   cfg.Security.SessionTimeout,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,                // 开发环境设为false，生产环境设为true
		SameSite: http.SameSiteLaxMode, // 添加SameSite设置
	})

	// 注册session中间件，使用配置文件中的session名称
	r.Use(sessions.Sessions(cfg.Security.SessionName, store))

	// 注册API路由
	r.POST("/api", middleware.PreJobMiddleware(cfg), middleware.AuthMiddleware(cfg.Security.CookieName), handle.Handle)

	// 根路径 - API信息页面
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"name":        "Beast Royale Backend API",
			"version":     "1.0.0",
			"description": "Beast Royale游戏后端服务",
			"status":      "running",
			"endpoints": gin.H{
				"unified": "/api",
				"health":  "/health",
			},
			"documentation": "请查看README.md了解详细API使用方法",
		})
	})

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Beast Royale Backend is running",
		})
	})

	// 保持向后兼容的端点（过渡期）
	r.POST("/api/v1/wallet/connect", func(c *gin.Context) {
		// 转换为统一格式
		var oldReq struct {
			Address string `json:"address"`
		}
		if err := c.ShouldBindJSON(&oldReq); err != nil {
			c.JSON(400, gin.H{"success": false, "message": "Invalid request"})
			return
		}

		// 构造统一格式的请求
		unifiedReq := gin.H{
			"Action":  "ConnectWallet",
			"Address": oldReq.Address,
		}
		c.Set("unified_request", unifiedReq)
		handle.Handle(c)
	})

	r.POST("/api/v1/wallet/verify", func(c *gin.Context) {
		// 转换为统一格式
		var oldReq struct {
			Address   string `json:"address"`
			Signature string `json:"signature"`
			Message   string `json:"message"`
		}
		if err := c.ShouldBindJSON(&oldReq); err != nil {
			c.JSON(400, gin.H{"success": false, "message": "Invalid request"})
			return
		}

		// 构造统一格式的请求
		unifiedReq := gin.H{
			"Action":    "VerifySignature",
			"Address":   oldReq.Address,
			"Signature": oldReq.Signature,
			"Message":   oldReq.Message,
		}
		c.Set("unified_request", unifiedReq)
		handle.Handle(c)
	})

	return r
}

func ginWaitGroup(wg *sync.WaitGroup) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.Set("SERVER_WAIT_GROUP", wg)
	}
}

func ginLogger() gin.HandlerFunc {
	// 使用简单的控制台日志，如果需要文件日志可以扩展
	return gin.LoggerWithWriter(gin.DefaultWriter)
}

// 如果需要文件日志，可以使用这个函数
func newRotateLogger(dir, prefix, suffix string, maxAge, rotationTime int) (io.Writer, error) {
	baseLogName := prefix + "." + suffix
	baseLogPath := path.Join(dir, baseLogName)
	writer, err := rotatelogs.New(
		baseLogPath+".%Y%m%d%H%M",
		rotatelogs.WithLinkName(baseLogPath),                               // 生成软链，指向最新日志文件
		rotatelogs.WithMaxAge(time.Duration(maxAge)*24*time.Hour),          // 文件最大保存时间
		rotatelogs.WithRotationTime(time.Duration(rotationTime)*time.Hour), // 日志切割时间间隔
	)
	if err != nil {
		return nil, err
	}

	return writer, nil
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := strings.TrimSpace(key); value != "" {
		return value
	}
	return defaultValue
}
