package models

import (
	"time"

	"gorm.io/gorm"
)

// Wallet 钱包模型
type Wallet struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null"`
	Address   string         `json:"address" gorm:"uniqueIndex;not null"`
	Balance   string         `json:"balance" gorm:"default:'0'"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	User User `json:"user" gorm:"foreignKey:UserID"`
}
