package db

import (
	"log"

	"beast-royale-backend/internal/config"
	"beast-royale-backend/internal/dao"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Init 初始化数据库连接
func Init() error {
	var err error

	// 使用配置文件中的数据库连接信息
	dsn := config.GConf.GetDatabaseDSN()
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	// 自动迁移数据库表
	err = DB.AutoMigrate(
		&dao.UserProfile{},
	)
	if err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

// GetDB 获取数据库实例
func GetDB() *gorm.DB {
	return DB
}

// Migrate 用于命令行迁移表结构
func Migrate() error {
	return DB.AutoMigrate(
		&dao.UserProfile{},
	)
}
