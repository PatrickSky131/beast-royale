package dao

import "time"

type UserProfile struct {
	Address            string    `gorm:"primaryKey;type:varchar(42)" json:"address"`
	Username           string    `gorm:"type:varchar(42);unique" json:"username,omitempty"`
	Bio                string    `gorm:"type:varchar(500)" json:"bio,omitempty"`
	AvatarURL          string    `gorm:"type:varchar(50)" json:"avatar_url,omitempty"`
	DiscordURL         string    `gorm:"type:varchar(100)" json:"discord_url,omitempty"`
	DiscordUsername    string    `gorm:"type:varchar(50)" json:"discord_username,omitempty"`
	XURL               string    `gorm:"type:varchar(100)" json:"x_url,omitempty"`
	XUsername          string    `gorm:"type:varchar(50)" json:"x_username,omitempty"`
	Points             int64     `gorm:"default:0" json:"points"`          // 积分
	Tokens             int64     `gorm:"default:0" json:"tokens"`          // 代币
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"created_at"` // 创建时间
	UpdatedAt          time.Time `gorm:"autoUpdateTime" json:"updated_at"` // 更新时间
	LastUsernameUpdate time.Time `json:"last_username_update,omitempty"`   // 上次更新用户名的时间，不要设置成注册时间
}

// TableName 设置表名
func (UserProfile) TableName() string {
	return "user_profile"
}
