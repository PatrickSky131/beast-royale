package wallet

import (
	"beast-royale-backend/internal/logger"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"

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

// VerifySignature 验证以太坊签名
func (ws *WalletService) VerifySignature(address, signature, message string) (bool, error) {
	// 添加调试日志
	logger.Info("=== 签名验证调试信息 ===")
	logger.Info("地址: %s", address)
	logger.Info("签名: %s", signature)
	logger.Info("消息: %q", message)
	logger.Info("消息长度: %d", len(message))

	// 移除0x前缀
	signature = strings.TrimPrefix(signature, "0x")
	address = strings.TrimPrefix(address, "0x")

	logger.Info("处理后的地址: %s", address)
	logger.Info("处理后的签名: %s", signature)

	// 转换为字节
	signatureBytes, err := hex.DecodeString(signature)
	if err != nil {
		logger.Error("签名解码失败: %v", err)
		return false, fmt.Errorf("invalid signature format: %v", err)
	}
	logger.Info("签名字节长度: %d", len(signatureBytes))

	// 检查签名长度
	if len(signatureBytes) != 65 {
		logger.Error("签名长度不正确，期望65字节，实际%d字节", len(signatureBytes))
		return false, fmt.Errorf("invalid signature length: expected 65, got %d", len(signatureBytes))
	}

	// 检查恢复ID
	recoveryID := signatureBytes[64]
	logger.Info("原始恢复ID: %d", recoveryID)

	// 以太坊签名中，恢复ID需要减去27
	if recoveryID != 27 && recoveryID != 28 {
		logger.Error("无效的恢复ID: %d，期望27或28", recoveryID)
		return false, fmt.Errorf("invalid recovery id: %d", recoveryID)
	}

	// 调整恢复ID（27->0, 28->1）
	adjustedRecoveryID := recoveryID - 27
	logger.Info("调整后的恢复ID: %d", adjustedRecoveryID)

	// 创建调整后的签名字节
	adjustedSignatureBytes := make([]byte, 65)
	copy(adjustedSignatureBytes, signatureBytes[:64])
	adjustedSignatureBytes[64] = adjustedRecoveryID

	// 构造以太坊签名消息格式（和ethers.js signMessage一致）
	// 格式: "\x19Ethereum Signed Message:\n" + len(message) + message
	messageBytes := []byte(message)
	messageLength := len(messageBytes)

	// 构造签名消息
	prefix := fmt.Sprintf("\x19Ethereum Signed Message:\n%d", messageLength)
	messageToHash := append([]byte(prefix), messageBytes...)

	logger.Info("前缀: %q", prefix)
	logger.Info("完整消息: %q", messageToHash)

	// 计算消息哈希
	messageHash := crypto.Keccak256Hash(messageToHash)
	logger.Info("消息哈希: %s", messageHash.Hex())

	// 恢复公钥
	pubKey, err := crypto.SigToPub(messageHash.Bytes(), adjustedSignatureBytes)
	if err != nil {
		logger.Error("公钥恢复失败: %v", err)
		return false, fmt.Errorf("failed to recover public key: %v", err)
	}
	logger.Info("恢复的公钥: %s", crypto.CompressPubkey(pubKey))

	// 从公钥恢复地址
	recoveredAddr := crypto.PubkeyToAddress(*pubKey)
	logger.Info("恢复的地址: %s", recoveredAddr.Hex())
	logger.Info("期望的地址: 0x%s", address)

	// 比较地址
	result := strings.EqualFold(recoveredAddr.Hex(), "0x"+address)
	logger.Info("地址匹配结果: %t", result)
	logger.Info("=== 签名验证调试结束 ===")

	return result, nil
}
