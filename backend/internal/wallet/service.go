package wallet

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"

	"beast-royale-backend/internal/db"
	"beast-royale-backend/internal/db/models"

	"github.com/ethereum/go-ethereum/crypto"
)

// WalletService 钱包服务
type WalletService struct{}

// NewWalletService 创建新的钱包服务实例
func NewWalletService() *WalletService {
	return &WalletService{}
}

// GenerateNonce 生成随机nonce
func (ws *WalletService) GenerateNonce() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// GetOrCreateUser 获取或创建用户
func (ws *WalletService) GetOrCreateUser(address string) (*models.User, error) {
	var user models.User

	// 检查用户是否存在
	result := db.GetDB().Where("address = ?", strings.ToLower(address)).First(&user)
	if result.Error == nil {
		// 用户存在，生成新的nonce
		nonce, err := ws.GenerateNonce()
		if err != nil {
			return nil, err
		}

		user.Nonce = nonce
		db.GetDB().Save(&user)
		return &user, nil
	}

	// 用户不存在，创建新用户
	nonce, err := ws.GenerateNonce()
	if err != nil {
		return nil, err
	}

	user = models.User{
		Address: strings.ToLower(address),
		Nonce:   nonce,
	}

	if err := db.GetDB().Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// VerifySignature 验证以太坊签名
func (ws *WalletService) VerifySignature(address, signature, message string) (bool, error) {
	// 移除0x前缀
	if strings.HasPrefix(signature, "0x") {
		signature = signature[2:]
	}

	// 解码签名
	sig, err := hex.DecodeString(signature)
	if err != nil {
		return false, err
	}

	// 检查签名长度
	if len(sig) != 65 {
		return false, fmt.Errorf("invalid signature length")
	}

	// 调整v值
	if sig[64] >= 27 {
		sig[64] -= 27
	}

	// 创建MetaMask personal_sign消息格式
	// MetaMask会自动添加前缀: "\x19Ethereum Signed Message:\n" + len(message) + message
	messageBytes := []byte(message)
	prefix := fmt.Sprintf("\x19Ethereum Signed Message:\n%d", len(messageBytes))
	messageHash := crypto.Keccak256Hash([]byte(prefix), messageBytes)

	// 恢复公钥
	pubKey, err := crypto.SigToPub(messageHash.Bytes(), sig)
	if err != nil {
		return false, err
	}

	// 从公钥恢复地址
	recoveredAddr := crypto.PubkeyToAddress(*pubKey)

	// 比较地址（忽略大小写）
	return strings.EqualFold(recoveredAddr.Hex(), address), nil
}

// GetUserByAddress 根据地址获取用户
func (ws *WalletService) GetUserByAddress(address string) (*models.User, error) {
	var user models.User
	err := db.GetDB().Where("address = ?", strings.ToLower(address)).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
