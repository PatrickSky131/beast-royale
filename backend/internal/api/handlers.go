package api

import (
	"net/http"
	"strings"

	"beast-royale-backend/internal/wallet"

	"github.com/gin-gonic/gin"
)

// Handler API处理器
type Handler struct {
	walletService *wallet.WalletService
}

// NewHandler 创建新的API处理器
func NewHandler() *Handler {
	return &Handler{
		walletService: wallet.NewWalletService(),
	}
}

// ConnectWalletRequest 连接钱包请求
type ConnectWalletRequest struct {
	Address string `json:"address" binding:"required"`
}

// ConnectWalletResponse 连接钱包响应
type ConnectWalletResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Nonce   string `json:"nonce,omitempty"`
}

// VerifySignatureRequest 验证签名请求
type VerifySignatureRequest struct {
	Address   string `json:"address" binding:"required"`
	Signature string `json:"signature" binding:"required"`
	Message   string `json:"message" binding:"required"`
}

// VerifySignatureResponse 验证签名响应
type VerifySignatureResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
}

// ConnectWallet 连接钱包处理器
func (h *Handler) ConnectWallet(c *gin.Context) {
	var req ConnectWalletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ConnectWalletResponse{
			Success: false,
			Message: "Invalid request parameters",
		})
		return
	}

	// 验证以太坊地址格式
	if !isValidEthereumAddress(req.Address) {
		c.JSON(http.StatusBadRequest, ConnectWalletResponse{
			Success: false,
			Message: "Invalid Ethereum address",
		})
		return
	}

	// 获取或创建用户
	user, err := h.walletService.GetOrCreateUser(req.Address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ConnectWalletResponse{
			Success: false,
			Message: "Failed to process wallet connection",
		})
		return
	}

	c.JSON(http.StatusOK, ConnectWalletResponse{
		Success: true,
		Message: "Wallet connected successfully",
		Nonce:   user.Nonce,
	})
}

// VerifySignature 验证签名处理器
func (h *Handler) VerifySignature(c *gin.Context) {
	var req VerifySignatureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, VerifySignatureResponse{
			Success: false,
			Message: "Invalid request parameters",
		})
		return
	}

	// 验证以太坊地址格式
	if !isValidEthereumAddress(req.Address) {
		c.JSON(http.StatusBadRequest, VerifySignatureResponse{
			Success: false,
			Message: "Invalid Ethereum address",
		})
		return
	}

	// 获取用户
	user, err := h.walletService.GetUserByAddress(req.Address)
	if err != nil {
		c.JSON(http.StatusNotFound, VerifySignatureResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	// 验证签名
	valid, err := h.walletService.VerifySignature(req.Address, req.Signature, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, VerifySignatureResponse{
			Success: false,
			Message: "Failed to verify signature",
		})
		return
	}

	if !valid {
		c.JSON(http.StatusUnauthorized, VerifySignatureResponse{
			Success: false,
			Message: "Invalid signature",
		})
		return
	}

	// 生成JWT token（这里简化处理，实际项目中应该使用JWT）
	token := "valid_token_" + user.Address

	c.JSON(http.StatusOK, VerifySignatureResponse{
		Success: true,
		Message: "Signature verified successfully",
		Token:   token,
	})
}

// HealthCheck 健康检查
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Beast Royale Backend is running",
	})
}

// isValidEthereumAddress 验证以太坊地址格式
func isValidEthereumAddress(address string) bool {
	// 移除0x前缀
	addr := strings.TrimPrefix(address, "0x")

	// 检查长度（40个十六进制字符）
	if len(addr) != 40 {
		return false
	}

	// 检查是否都是十六进制字符
	for _, char := range addr {
		if !((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')) {
			return false
		}
	}

	return true
}
