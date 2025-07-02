# 🏗️ Beast Royale API 架构文档 (Task模式)

## 📁 新的API文件结构

按照Task模式重新设计的API架构：

```
backend/internal/handle/
└── handle.go          # 主要处理器，使用api包的Task接口

backend/internal/api/
├── action.go              # Task接口定义和注册机制
├── base.go                # 基础请求响应结构和工具函数
├── common.go              # 常量标签和通用函数
├── wallet.go              # 钱包基础服务（共享功能，非API）
├── connectwallet.go       # ConnectWallet Action (Task)
├── verifysignature.go     # VerifySignature Action (Task)
├── getuserinfo.go         # GetUserInfo Action (Task)
└── healthcheck.go         # HealthCheck Action (Task)
```

## 🎯 Task模式架构设计

### 1. 核心概念
- **Task接口** - 所有API任务必须实现的接口
- **AuthType** - 认证类型枚举（NOAUTH、VERIFYAUTH、COOKIEAUTH）
- **Register函数** - 任务注册函数，支持认证类型
- **BaseRequest/BaseResponse** - 统一的请求/响应基础结构

### 2. 分层架构
```
HTTP请求 → Handler层 → Task层 → API服务层 → 业务逻辑层 → 数据层
```

- **Handler层** (`internal/handle/`) - 请求路由和Task执行
- **Task层** (`internal/api/*.go`) - 具体的API任务实现
- **API服务层** (`internal/api/wallet.go`) - 共享的业务服务
- **业务逻辑层** - 核心业务规则
- **数据层** - 数据库操作

### 3. Task模式统一接口
每个API文件都遵循相同的Task模式：

```go
// 1. 在init()中注册Task（使用common.go中的常量）
func init() {
    Register(XXX_LABEL, NewXXXTask, AUTH_TYPE)
}

// 2. 请求结构
type XXXRequest struct {
    BaseRequest
    // 具体字段...
}

// 3. 响应结构
type XXXResponse struct {
    BaseResponse
    // 具体字段...
}

// 4. Task结构
type XXXTask struct {
    Request  *XXXRequest
    Response *XXXResponse
}

// 5. 工厂函数
func NewXXXTask(data *map[string]interface{}) (Task, error) {
    // 创建和验证Task
}

// 6. 执行方法
func (task *XXXTask) Run(c *gin.Context) (Response, error) {
    // 业务逻辑
}
```

## 📋 当前可用的API

### 1. ConnectWallet API
**文件**: `connectwallet.go`  
**Action**: `ConnectWallet`  
**认证**: `NOAUTH`  
**功能**: 连接钱包，获取nonce

```go
// 请求
type ConnectWalletRequest struct {
    BaseRequest
    Address string `mapstructure:"Address" validate:"required"`
}

// 响应
type ConnectWalletResponse struct {
    BaseResponse
    Nonce string `json:"nonce"`
}
```

### 2. VerifySignature API
**文件**: `verifysignature.go`  
**Action**: `VerifySignature`  
**认证**: `NOAUTH`  
**功能**: 验证签名，获取token

```go
// 请求
type VerifySignatureRequest struct {
    BaseRequest
    Address   string `mapstructure:"Address" validate:"required"`
    Signature string `mapstructure:"Signature" validate:"required"`
    Message   string `mapstructure:"Message" validate:"required"`
}

// 响应
type VerifySignatureResponse struct {
    BaseResponse
    Token string `json:"token"`
}
```

### 3. GetUserInfo API
**文件**: `getuserinfo.go`  
**Action**: `GetUserInfo`  
**认证**: `COOKIEAUTH`  
**功能**: 获取用户信息

```go
// 请求
type GetUserInfoRequest struct {
    BaseRequest
    Address string `mapstructure:"Address" validate:"required"`
}

// 响应
type GetUserInfoResponse struct {
    BaseResponse
    Address string `json:"address"`
    Nonce   string `json:"nonce"`
}
```

### 4. HealthCheck API
**文件**: `healthcheck.go`  
**Action**: `HealthCheck`  
**认证**: `NOAUTH`  
**功能**: 健康检查

```go
// 请求
type HealthCheckRequest struct {
    BaseRequest
}

// 响应
type HealthCheckResponse struct {
    BaseResponse
    Status  string `json:"status"`
    Version string `json:"version"`
}
```

## 🔄 请求处理流程

```
前端请求 (Action-based格式)
    ↓
handle.go (统一处理器)
    ↓
api.Exist() (检查Action是否存在)
    ↓
api.NewTask() (创建Task实例)
    ↓
Task.Run() (执行具体业务逻辑)
    ↓
wallet.go (共享服务)
    ↓
数据库/外部服务
```

## 🚀 扩展新API的方法

### 1. 创建新的API文件
```bash
# 例如添加 CreateBeast API
touch internal/api/createbeast.go
```

### 2. 在common.go中添加常量
```go
const CREATE_BEAST_LABEL = "CreateBeast"
```

### 3. 实现Task模式结构
```go
// createbeast.go
package api

import (
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
    "github.com/mitchellh/mapstructure"
)

func init() {
    Register(CREATE_BEAST_LABEL, NewCreateBeastTask, COOKIEAUTH)
}

type CreateBeastRequest struct {
    BaseRequest
    Name   string `mapstructure:"Name" validate:"required"`
    Type   string `mapstructure:"Type" validate:"required"`
    UserID uint   `mapstructure:"UserID" validate:"required"`
}

type CreateBeastResponse struct {
    BaseResponse
    BeastID uint   `json:"beast_id"`
    Name    string `json:"name"`
    Type    string `json:"type"`
}

type CreateBeastTask struct {
    Request  *CreateBeastRequest
    Response *CreateBeastResponse
}

func NewCreateBeastRequest(data *map[string]interface{}) (*CreateBeastRequest, error) {
    req := &CreateBeastRequest{}
    err := mapstructure.Decode(*data, &req)
    if err != nil {
        return nil, err
    }
    req.BaseRequest.RequestUUID = (*data)["RequestUUID"].(string)
    return req, nil
}

func NewCreateBeastResponse(sessionId string) *CreateBeastResponse {
    return &CreateBeastResponse{
        BaseResponse: BaseResponse{
            Action:      CREATE_BEAST_LABEL + "Response",
            RequestUUID: sessionId,
            RetCode:     0,
        },
    }
}

func NewCreateBeastTask(data *map[string]interface{}) (Task, error) {
    req, err := NewCreateBeastRequest(data)
    if err != nil {
        return nil, err
    }
    
    task := &CreateBeastTask{
        Request:  req,
        Response: NewCreateBeastResponse(req.BaseRequest.RequestUUID),
    }
    
    validate := validator.New()
    err = validate.Struct(task.Request)
    if err != nil {
        return nil, err
    }

    return task, nil
}

func (task *CreateBeastTask) Run(c *gin.Context) (Response, error) {
    // 实现业务逻辑
    // 调用相应的服务层
    return task.Response, nil
}
```

## ✅ Task模式的优势

1. **统一接口** - 所有API都遵循相同的Task接口
2. **自动注册** - 通过init()函数自动注册到全局注册表
3. **认证支持** - 支持多种认证类型（NOAUTH、VERIFYAUTH、COOKIEAUTH）
4. **类型安全** - 强类型的请求和响应结构
5. **易于测试** - 每个Task都可以独立测试
6. **易于扩展** - 添加新API只需实现Task接口
7. **错误处理** - 统一的错误处理机制
8. **日志记录** - 自动记录请求和响应日志

## 🔧 基础文件功能

### action.go
- Task接口定义
- AuthType认证类型枚举
- 全局注册表管理
- Task创建和查询函数

### base.go
- BaseRequest/BaseResponse基础结构
- Response接口定义
- 工具函数（类型转换、键生成等）
- 错误响应创建函数

### common.go
- Action标签常量定义
- 参数标签常量定义
- 通用工具函数
- 代码模板函数

## 🚨 认证类型说明

- **NOAUTH** - 无需认证，任何人都可以访问
- **VERIFYAUTH** - 需要验证但不使用cookie（如签名验证）
- **COOKIEAUTH** - 使用cookie进行认证

## 🔧 测试

编译测试：
```bash
go build -o /tmp/test-build .
```

运行测试：
```bash
go test ./internal/api/...
```

## 📝 注意事项

1. **wallet.go** 是共享服务，不是API，被其他API调用
2. 每个API文件对应一个Action
3. 所有Task都会自动注册到全局注册表
4. 请求验证使用validator标签
5. 响应格式统一使用BaseResponse
6. 认证类型在注册时指定
7. 常量定义集中在common.go中 