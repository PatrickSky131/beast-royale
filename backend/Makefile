# Makefile for Beast Royale Backend

# 二进制文件名称
BINARY_NAME=beast-royale-backend
BINARY_DIR=bin

# 编译目标平台
GOOS?=darwin
GOARCH?=amd64

# 默认目标
.PHONY: all
all: build

# 编译项目
.PHONY: build
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BINARY_DIR)
	@GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o $(BINARY_DIR)/$(BINARY_NAME) .

# 运行项目
.PHONY: run
run: build
	@echo "Running $(BINARY_NAME)..."
	@./$(BINARY_DIR)/$(BINARY_NAME)

# 清理编译文件
.PHONY: clean
clean:
	@echo "Cleaning..."
	@rm -rf $(BINARY_DIR)/$(BINARY_NAME)

# 安装依赖
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy

# 测试
.PHONY: test
test:
	@echo "Running tests..."
	@go test ./...

# 格式化代码
.PHONY: fmt
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# 代码检查
.PHONY: lint
lint:
	@echo "Linting code..."
	@golangci-lint run

# 开发模式运行（直接运行，不编译）
.PHONY: dev
dev:
	@echo "Running in development mode..."
	@go run main.go run --config config.yaml

# 帮助信息
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  build   - Build the binary"
	@echo "  run     - Build and run the binary"
	@echo "  clean   - Clean build artifacts"
	@echo "  deps    - Install dependencies"
	@echo "  test    - Run tests"
	@echo "  fmt     - Format code"
	@echo "  lint    - Lint code"
	@echo "  dev     - Run in development mode"
	@echo "  help    - Show this help" 