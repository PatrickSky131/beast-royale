#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const net = require('net');

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close();
      resolve(false); // 端口可用
    });
    server.on('error', () => {
      resolve(true); // 端口被占用
    });
  });
}

// 检查是否有ngrok进程运行
function checkNgrok() {
  return new Promise((resolve) => {
    exec('pgrep -f ngrok', (error) => {
      resolve(!error); // 如果找到ngrok进程，error为null
    });
  });
}

// 获取可用的端口
async function getAvailablePort(startPort = 5173) {
  for (let port = startPort; port < startPort + 10; port++) {
    const isOccupied = await checkPort(port);
    if (!isOccupied) {
      return port;
    }
  }
  throw new Error('没有找到可用的端口');
}

// 启动Vite开发服务器
function startVite(port) {
  console.log(`🚀 启动Vite开发服务器，端口: ${port}`);
  
  const vite = spawn('npx', ['vite', '--port', port.toString(), '--host', '0.0.0.0'], {
    stdio: 'inherit',
    shell: true
  });

  vite.on('close', (code) => {
    console.log(`Vite进程退出，代码: ${code}`);
  });

  return vite;
}

// 主函数
async function main() {
  console.log('🔍 检查开发环境...');
  
  // 检查ngrok
  const hasNgrok = await checkNgrok();
  if (hasNgrok) {
    console.log('✅ 检测到ngrok进程正在运行');
  } else {
    console.log('ℹ️ 未检测到ngrok进程');
  }
  
  // 检查端口5173
  const port5173Occupied = await checkPort(5173);
  
  if (port5173Occupied) {
    console.log('⚠️ 端口5173被占用');
    
    if (hasNgrok) {
      console.log('💡 检测到ngrok正在运行，尝试使用端口5174');
      const port = await getAvailablePort(5174);
      console.log(`🎯 使用端口: ${port}`);
      startVite(port);
    } else {
      console.log('❓ 端口5173被占用，但未检测到ngrok');
      console.log('💡 建议：');
      console.log('   1. 使用 npm run stop 停止现有进程');
      console.log('   2. 或使用 npm run dev:safe 自动选择端口');
      
      const port = await getAvailablePort(5173);
      console.log(`🎯 尝试使用端口: ${port}`);
      startVite(port);
    }
  } else {
    console.log('✅ 端口5173可用');
    startVite(5173);
  }
}

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 收到中断信号，正在退出...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在退出...');
  process.exit(0);
});

// 运行主函数
main().catch(console.error); 