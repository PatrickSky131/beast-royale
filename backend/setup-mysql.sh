#!/bin/bash

# MySQL设置脚本
# 用法: ./setup-mysql.sh [选项]
# 选项:
#   --ip IP地址        指定MySQL服务器IP地址 (默认: localhost)
#   --user 用户名      指定MySQL用户名 (默认: root)
#   --password 密码    指定MySQL密码 (默认: 无密码)
#   --help            显示帮助信息
#
# 示例: 
#   ./setup-mysql.sh --ip 192.168.1.100 --user admin --password mypassword
#   ./setup-mysql.sh --ip localhost --user root
#   ./setup-mysql.sh --help

# 设置默认值
MYSQL_IP="localhost"
MYSQL_USER="root"
MYSQL_PASSWORD=""

# 显示帮助信息
show_help() {
    echo "MySQL设置脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --ip IP地址        指定MySQL服务器IP地址 (默认: localhost)"
    echo "  --user 用户名      指定MySQL用户名 (默认: root)"
    echo "  --password 密码    指定MySQL密码 (默认: 无密码)"
    echo "  --help            显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --ip 192.168.1.100 --user admin --password mypassword"
    echo "  $0 --ip localhost --user root"
    echo "  $0 --help"
    exit 0
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --ip)
            MYSQL_IP="$2"
            shift 2
            ;;
        --user)
            MYSQL_USER="$2"
            shift 2
            ;;
        --password)
            MYSQL_PASSWORD="$2"
            shift 2
            ;;
        --help)
            show_help
            ;;
        *)
            echo "错误: 未知选项 $1"
            echo "使用 --help 查看帮助信息"
            exit 1
            ;;
    esac
done

# 构建MySQL连接参数
MYSQL_OPTS="-h $MYSQL_IP -u $MYSQL_USER"
if [ -n "$MYSQL_PASSWORD" ]; then
    MYSQL_OPTS="$MYSQL_OPTS -p$MYSQL_PASSWORD"
fi

echo "正在设置MySQL数据库..."
echo "连接信息: IP=$MYSQL_IP, 用户=$MYSQL_USER"

# 检查MySQL是否运行
if ! mysqladmin ping $MYSQL_OPTS --silent; then
    echo "错误: MySQL服务未运行或连接失败"
    echo "请检查以下信息："
    echo "  - IP地址: $MYSQL_IP"
    echo "  - 用户名: $MYSQL_USER"
    echo "  - 密码: ${MYSQL_PASSWORD:-未设置}"
    echo "  - MySQL服务是否正在运行"
    exit 1
fi

# 创建数据库
echo "创建数据库 beast_royale..."
mysql $MYSQL_OPTS -e "CREATE DATABASE IF NOT EXISTS beast_royale CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 检查数据库是否创建成功
if mysql $MYSQL_OPTS -e "USE beast_royale; SELECT 1;" > /dev/null 2>&1; then
    echo "✅ 数据库 beast_royale 创建成功"
else
    echo "❌ 数据库创建失败"
    exit 1
fi

echo "✅ MySQL设置完成！"
echo "连接信息: $MYSQL_IP:$MYSQL_USER"
echo "现在可以运行以下命令启动后端服务："
echo "  ./beast-royale-backend run -c config.yaml" 