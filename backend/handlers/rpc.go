package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RPCRequest RPC请求结构
type RPCRequest struct {
	Method string      `json:"method" binding:"required"`
	Params interface{} `json:"params"`
	ID     interface{} `json:"id"`
}

// RPCResponse RPC响应结构
type RPCResponse struct {
	Result interface{} `json:"result,omitempty"`
	Error  *RPCError   `json:"error,omitempty"`
	ID     interface{} `json:"id"`
}

// RPCError RPC错误结构
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// RPCHandler RPC处理器
type RPCHandler struct {
	walletHandler *WalletHandler
	systemHandler *SystemHandler
}

// NewRPCHandler 创建新的RPC处理器
func NewRPCHandler() *RPCHandler {
	return &RPCHandler{
		walletHandler: NewWalletHandler(),
		systemHandler: NewSystemHandler(),
	}
}

// HandleRPC 处理RPC请求
func (h *RPCHandler) HandleRPC(c *gin.Context) {
	var req RPCRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, RPCResponse{
			Error: &RPCError{
				Code:    -32600,
				Message: "Invalid Request",
			},
			ID: req.ID,
		})
		return
	}

	// 根据方法名路由到对应的处理器
	switch req.Method {
	case "system.health":
		h.handleHealth(c, req)
	case "wallet.connect":
		h.handleWalletConnect(c, req)
	case "wallet.verify":
		h.handleWalletVerify(c, req)
	default:
		c.JSON(http.StatusOK, RPCResponse{
			Error: &RPCError{
				Code:    -32601,
				Message: "Method not found",
			},
			ID: req.ID,
		})
	}
}

// handleHealth 处理健康检查
func (h *RPCHandler) handleHealth(c *gin.Context, req RPCRequest) {
	c.JSON(http.StatusOK, RPCResponse{
		Result: gin.H{
			"status":  "ok",
			"message": "Beast Royale Backend is running",
		},
		ID: req.ID,
	})
}

// handleWalletConnect 处理钱包连接
func (h *RPCHandler) handleWalletConnect(c *gin.Context, req RPCRequest) {
	// 从RPC参数中提取地址
	params, ok := req.Params.(map[string]interface{})
	if !ok {
		c.JSON(http.StatusBadRequest, RPCResponse{
			Error: &RPCError{
				Code:    -32602,
				Message: "Invalid parameters",
			},
			ID: req.ID,
		})
		return
	}

	address, ok := params["address"].(string)
	if !ok {
		c.JSON(http.StatusBadRequest, RPCResponse{
			Error: &RPCError{
				Code:    -32602,
				Message: "Address parameter is required",
			},
			ID: req.ID,
		})
		return
	}

	// 验证以太坊地址格式
	if !h.isValidEthereumAddress(address) {
		c.JSON(http.StatusBadRequest, RPCResponse{
			Error: &RPCError{
				Code:    -32602,
				Message: "Invalid Ethereum address",
			},
			ID: req.ID,
		})
		return
	}

	// 获取或创建用户
	user, err := h.walletHandler.walletService.GetOrCreateUser(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, RPCResponse{
			Error: &RPCError{
				Code:    -32603,
				Message: "Failed to process wallet connection",
			},
			ID: req.ID,
		})
		return
	}

	c.JSON(http.StatusOK, RPCResponse{
		Result: gin.H{
			"success": true,
			"message": "Wallet connected successfully",
			"nonce":   user.Nonce,
		},
		ID: req.ID,
	})
}

// handleWalletVerify 处理钱包验证
func (h *RPCHandler) handleWalletVerify(c *gin.Context, req RPCRequest) {
	// 从RPC参数中提取数据
	params, ok := req.Params.(map[string]interface{})
	if !ok {
		c.JSON(http.StatusBadRequest, RPCResponse{
			Error: &RPCError{
				Code:    -32602,
				Message: "Invalid parameters",
			},
			ID: req.ID,
		})
		return
	}

	address, ok1 := params["address"].(string)
	signature, ok2 := params["signature"].(string)
	message, ok3 := params["message"].(string)

	if !ok1 || !ok2 || !ok3 {
		c.JSON(http.StatusBadRequest, RPCResponse{
			Error: &RPCError{
				Code:    -32602,
				Message: "Address, signature, and message parameters are required",
			},
			ID: req.ID,
		})
		return
	}

	// 验证以太坊地址格式
	if !h.isValidEthereumAddress(address) {
		c.JSON(http.StatusBadRequest, RPCResponse{
			Error: &RPCError{
				Code:    -32602,
				Message: "Invalid Ethereum address",
			},
			ID: req.ID,
		})
		return
	}

	// 获取用户
	user, err := h.walletHandler.walletService.GetUserByAddress(address)
	if err != nil {
		c.JSON(http.StatusNotFound, RPCResponse{
			Error: &RPCError{
				Code:    -32604,
				Message: "User not found",
			},
			ID: req.ID,
		})
		return
	}

	// 验证签名
	valid, err := h.walletHandler.walletService.VerifySignature(address, signature, message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, RPCResponse{
			Error: &RPCError{
				Code:    -32603,
				Message: "Failed to verify signature",
			},
			ID: req.ID,
		})
		return
	}

	if !valid {
		c.JSON(http.StatusUnauthorized, RPCResponse{
			Error: &RPCError{
				Code:    -32605,
				Message: "Invalid signature",
			},
			ID: req.ID,
		})
		return
	}

	// 生成JWT token（这里简化处理，实际项目中应该使用JWT）
	token := "valid_token_" + user.Address

	c.JSON(http.StatusOK, RPCResponse{
		Result: gin.H{
			"success": true,
			"message": "Signature verified successfully",
			"token":   token,
		},
		ID: req.ID,
	})
}

// isValidEthereumAddress 验证以太坊地址格式
func (h *RPCHandler) isValidEthereumAddress(address string) bool {
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
