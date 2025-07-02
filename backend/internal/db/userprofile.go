package db

import (
	"beast-royale-backend/internal/dao"
)

// GetUserProfileByAddress 根据地址获取用户档案
func GetUserProfileByAddress(address string) (*dao.UserProfile, error) {
	var profile dao.UserProfile
	err := GetDB().Where("address = ?", address).First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

// CreateUserProfile 创建用户档案
func CreateUserProfile(profile *dao.UserProfile) error {
	return GetDB().Create(profile).Error
}

// UpdateUserProfile 更新用户档案
func UpdateUserProfile(profile *dao.UserProfile) error {
	return GetDB().Save(profile).Error
}

// DeleteUserProfile 删除用户档案（软删除）
func DeleteUserProfile(address string) error {
	return GetDB().Where("address = ?", address).Delete(&dao.UserProfile{}).Error
}

// GetUserProfileByUsername 根据用户名获取用户档案
func GetUserProfileByUsername(username string) (*dao.UserProfile, error) {
	var profile dao.UserProfile
	err := GetDB().Where("username = ?", username).First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

// EnsureUserProfileExists 确保用户档案存在，如果不存在则创建
func EnsureUserProfileExists(address string) error {
	// 检查用户档案是否已存在
	profile, err := GetUserProfileByAddress(address)
	if err == nil && profile != nil {
		// 用户档案已存在
		return nil
	}

	// 用户档案不存在，创建基础档案
	basicProfile := &dao.UserProfile{
		Address:  address,
		Username: address, // 注册时用户名和地址相同，保证唯一性
		Points:   0,       // 默认积分为0
		Tokens:   1000,    // 默认代币为1000
	}

	return CreateUserProfile(basicProfile)
}
