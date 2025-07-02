package handle

import (
	"encoding/json"
	"net/http"

	"beast-royale-backend/internal/api"
	"beast-royale-backend/internal/logger"

	"github.com/gin-gonic/gin"
)

// Handle 统一处理器
func Handle(c *gin.Context) {
	// 从PreJobMiddleware获取已解析的数据
	action := c.GetString("action")
	if action == "" {
		logger.Error("Action not found in context")
		c.JSON(http.StatusBadRequest, api.MakeErrorResponse(400, "Action not found"))
		return
	}

	_params, exists := c.Get("params")
	if !exists {
		logger.Error("Params not found in context")
		c.JSON(http.StatusBadRequest, api.MakeErrorResponse(400, "Params not found"))
		return
	}

	requestData, ok := _params.(*map[string]interface{})
	if !ok {
		logger.Error("Params type assertion failed")
		c.JSON(http.StatusBadRequest, api.MakeErrorResponse(400, "Invalid params format"))
		return
	}

	// 获取RequestUUID
	reqUUID := c.GetString("RequestUUID")
	if reqUUID == "" {
		logger.Error("RequestUUID not found in context")
		c.JSON(http.StatusBadRequest, api.MakeErrorResponse(400, "RequestUUID not found"))
		return
	}

	// 记录请求日志
	logger.Info("收到请求 - Action: %s, UUID: %s, Client: %s",
		action, reqUUID, c.ClientIP())

	// 检查Action是否存在
	if !api.Exist(action) {
		c.JSON(http.StatusBadRequest, api.MakeErrorResponse(400, "Unknown action: "+action))
		return
	}

	// 创建任务
	task, err := api.NewTask(action, requestData)
	if err != nil {
		logger.Error("创建任务失败: %v", err)
		c.JSON(http.StatusBadRequest, api.MakeErrorResponse(400, "Failed to create task: "+err.Error()))
		return
	}

	// 执行任务
	response, err := task.Run(c)
	if err != nil {
		logger.Error("执行任务失败: %v", err)
		c.JSON(http.StatusInternalServerError, api.MakeErrorResponse(500, "Task execution failed: "+err.Error()))
		return
	}

	// 记录响应日志
	resJson, _ := json.Marshal(response)
	logger.Info("发送响应 - Action: %s, UUID: %s, Client: %s, Response: %s",
		action, response.GetRequestUUID(), c.ClientIP(), string(resJson))

	// 返回响应
	c.JSON(http.StatusOK, response)
}
