package logger

import (
	"log"
	"os"
	"path/filepath"
	"time"
)

var (
	InfoLogger  *log.Logger
	ErrorLogger *log.Logger
	DebugLogger *log.Logger
)

// Init 初始化日志系统
func Init() error {
	// 创建logs目录
	logsDir := "bin/logs"
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return err
	}

	// 创建日志文件
	currentTime := time.Now().Format("2006-01-02")
	logFile, err := os.OpenFile(
		filepath.Join(logsDir, "app-"+currentTime+".log"),
		os.O_APPEND|os.O_CREATE|os.O_WRONLY,
		0644,
	)
	if err != nil {
		return err
	}

	// 初始化不同类型的日志记录器
	InfoLogger = log.New(logFile, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
	ErrorLogger = log.New(logFile, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile)
	DebugLogger = log.New(logFile, "DEBUG: ", log.Ldate|log.Ltime|log.Lshortfile)

	// 同时输出到控制台和文件
	InfoLogger.SetOutput(os.Stdout)
	ErrorLogger.SetOutput(os.Stderr)
	DebugLogger.SetOutput(os.Stdout)

	return nil
}

// Info 记录信息日志
func Info(format string, v ...interface{}) {
	if InfoLogger != nil {
		InfoLogger.Printf(format, v...)
	}
}

// Error 记录错误日志
func Error(format string, v ...interface{}) {
	if ErrorLogger != nil {
		ErrorLogger.Printf(format, v...)
	}
}

// Debug 记录调试日志
func Debug(format string, v ...interface{}) {
	if DebugLogger != nil {
		DebugLogger.Printf(format, v...)
	}
}
