package handlers

import (
	"net/http"
	"strings"

	"beast-royale-backend/internal/wallet"

	"github.com/gin-gonic/gin"
)

// WalletHandler 钱包处理器
type WalletHandler struct {
	walletService *wallet.WalletService
}

// NewWalletHandler 创建新的钱包处理器
func NewWalletHandler() *WalletHandler {
	return &WalletHandler{
		walletService: wallet.NewWalletService(),
	}
}

// ConnectRequest 连接钱包请求
type ConnectRequest struct {
	Address string `json:"address" binding:"required"`
}

// ConnectResponse 连接钱包响应
type ConnectResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Nonce   string `json:"nonce,omitempty"`
}

// VerifyRequest 验证签名请求
type VerifyRequest struct {
	Address   string `json:"address" binding:"required"`
	Signature string `json:"signature" binding:"required"`
	Message   string `json:"message" binding:"required"`
}

// VerifyResponse 验证签名响应
type VerifyResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
}

// Connect 连接钱包RPC方法
func (h *WalletHandler) Connect(c *gin.Context) {
	var req ConnectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ConnectResponse{
			Success: false,
			Message: "Invalid request parameters",
		})
		return
	}

	// 验证以太坊地址格式
	if !isValidEthereumAddress(req.Address) {
		c.JSON(http.StatusBadRequest, ConnectResponse{
			Success: false,
			Message: "Invalid Ethereum address",
		})
		return
	}

	// 获取或创建用户
	user, err := h.walletService.GetOrCreateUser(req.Address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ConnectResponse{
			Success: false,
			Message: "Failed to process wallet connection",
		})
		return
	}

	c.JSON(http.StatusOK, ConnectResponse{
		Success: true,
		Message: "Wallet connected successfully",
		Nonce:   user.Nonce,
	})
}

// Verify 验证签名RPC方法
func (h *WalletHandler) Verify(c *gin.Context) {
	var req VerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, VerifyResponse{
			Success: false,
			Message: "Invalid request parameters",
		})
		return
	}

	// 验证以太坊地址格式
	if !isValidEthereumAddress(req.Address) {
		c.JSON(http.StatusBadRequest, VerifyResponse{
			Success: false,
			Message: "Invalid Ethereum address",
		})
		return
	}

	// 获取用户
	user, err := h.walletService.GetUserByAddress(req.Address)
	if err != nil {
		c.JSON(http.StatusNotFound, VerifyResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	// 验证签名
	valid, err := h.walletService.VerifySignature(req.Address, req.Signature, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, VerifyResponse{
			Success: false,
			Message: "Failed to verify signature",
		})
		return
	}

	if !valid {
		c.JSON(http.StatusUnauthorized, VerifyResponse{
			Success: false,
			Message: "Invalid signature",
		})
		return
	}

	// 生成JWT token（这里简化处理，实际项目中应该使用JWT）
	token := "valid_token_" + user.Address

	c.JSON(http.StatusOK, VerifyResponse{
		Success: true,
		Message: "Signature verified successfully",
		Token:   token,
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
