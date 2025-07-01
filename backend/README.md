# Beast Royale Backend

这是一个基于Go语言的后端服务，使用Gin框架和GORM进行开发，采用RPC风格的API设计。

## 项目结构

```
backend/
├── main.go                    # 主入口文件
├── cmd/
│   └── run.go                # 启动逻辑
├── handlers/                  # RPC处理器（在internal外面）
│   ├── wallet.go             # 钱包相关RPC方法
│   ├── system.go             # 系统相关RPC方法
│   └── rpc.go                # RPC路由处理器
├── internal/                  # 内部包
│   ├── db/                   # 数据库相关
│   ├── server/               # 服务器相关
│   ├── wallet/               # 钱包服务
│   └── logger/               # 日志系统
├── bin/                      # 编译输出目录
│   ├── beast-royale-server   # 二进制文件
│   └── logs/                 # 日志文件目录
├── Makefile                  # 构建脚本
└── go.mod                    # Go模块文件
```

## RPC API 设计

### 端点
- **RPC端点**: `POST /rpc`
- **兼容性端点**: `POST /api/v1/wallet/connect`, `POST /api/v1/wallet/verify`
- **健康检查**: `GET /health`

### RPC请求格式
```json
{
  "method": "wallet.connect",
  "params": {
    "address": "0x..."
  },
  "id": 1
}
```

### RPC响应格式
```json
{
  "result": {
    "success": true,
    "message": "Wallet connected successfully",
    "nonce": "..."
  },
  "id": 1
}
```

### 可用的RPC方法

#### 1. 系统方法
- `system.health` - 健康检查

#### 2. 钱包方法
- `wallet.connect` - 连接钱包
- `wallet.verify` - 验证签名

## 快速开始

### 开发模式运行
```bash
# 直接运行（开发模式）
make dev

# 或者
go run main.go
```

### 编译并运行
```bash
# 编译项目
make build

# 编译并运行
make run

# 清理编译文件
make clean
```

### 其他命令
```bash
# 安装依赖
make deps

# 运行测试
make test

# 格式化代码
make fmt

# 代码检查
make lint

# 查看帮助
make help
```

## API使用示例

### 1. 使用RPC端点

#### 连接钱包
```bash
curl -X POST http://localhost:8080/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "wallet.connect",
    "params": {
      "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
    },
    "id": 1
  }'
```

#### 验证签名
```bash
curl -X POST http://localhost:8080/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "wallet.verify",
    "params": {
      "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "signature": "0x...",
      "message": "连接Beast Royale游戏..."
    },
    "id": 1
  }'
```

### 2. 使用兼容性端点（向后兼容）

#### 连接钱包
```bash
curl -X POST http://localhost:8080/api/v1/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

#### 验证签名
```bash
curl -X POST http://localhost:8080/api/v1/wallet/verify \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "signature": "0x...",
    "message": "连接Beast Royale游戏..."
  }'
```

## 环境配置

1. 复制环境变量模板文件：
```bash
cp env.example .env
```

2. 编辑 `.env` 文件，配置必要的环境变量：
```env
PORT=8080
DB_PATH=beast_royale.db
```

## 日志系统

日志文件会自动保存在 `bin/logs/` 目录下，按日期命名（如：`app-2024-01-15.log`）。

日志级别包括：
- INFO: 信息日志
- ERROR: 错误日志
- DEBUG: 调试日志

## 部署

### 编译二进制文件
```bash
# 编译当前平台
make build

# 编译Linux版本
GOOS=linux GOARCH=amd64 make build

# 编译Windows版本
GOOS=windows GOARCH=amd64 make build
```

### 运行二进制文件
```bash
./bin/beast-royale-server
```

## 开发说明

- 主入口文件：`main.go`
- 启动逻辑：`cmd/run.go`
- RPC处理器：`handlers/` 目录
- 日志系统：`internal/logger/`
- 数据库操作：`internal/db/`
- 服务器配置：`internal/server/`

## 依赖管理

项目使用Go模块进行依赖管理：
```bash
# 添加新依赖
go get github.com/example/package

# 更新依赖
go mod tidy
```

## 架构优势

### RPC风格的优势
1. **统一接口**: 所有API调用都通过 `/rpc` 端点
2. **方法路由**: 通过 `method` 字段路由到具体处理器
3. **请求ID**: 支持请求追踪和异步处理
4. **错误处理**: 标准化的错误响应格式
5. **向后兼容**: 保留原有的REST API端点

### 代码组织优势
1. **处理器外置**: handlers在internal外面，便于扩展
2. **模块化设计**: 每个功能模块独立的处理器
3. **清晰分层**: 处理器、服务、数据访问层分离
4. **易于测试**: 每个组件都可以独立测试 