package db

import (
	"log"

	"beast-royale-backend/internal/db/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Init 初始化数据库连接
func Init() error {
	var err error
	DB, err = gorm.Open(sqlite.Open("beast_royale.db"), &gorm.Config{})
	if err != nil {
		return err
	}

	// 自动迁移数据库表
	err = DB.AutoMigrate(
		&models.User{},
		&models.Wallet{},
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
