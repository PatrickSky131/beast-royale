#!/bin/bash

# MySQL设置脚本
echo "正在设置MySQL数据库..."

# 检查MySQL是否运行
if ! mysqladmin ping -h localhost -u root --silent; then
    echo "错误: MySQL服务未运行或连接失败"
    echo "请确保MySQL已安装并运行"
    exit 1
fi

# 创建数据库
echo "创建数据库 beast_royale..."
mysql -h localhost -u root -e "CREATE DATABASE IF NOT EXISTS beast_royale CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 检查数据库是否创建成功
if mysql -h localhost -u root -e "USE beast_royale; SELECT 1;" > /dev/null 2>&1; then
    echo "✅ 数据库 beast_royale 创建成功"
else
    echo "❌ 数据库创建失败"
    exit 1
fi

echo "✅ MySQL设置完成！"
echo "现在可以运行以下命令启动后端服务："
echo "  ./beast-royale-backend run -c config.yaml" 