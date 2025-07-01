import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from 'ethers';

class WalletConnectService {
  constructor() {
    this.provider = null;
    this.ethersProvider = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
  }

  // 初始化WalletConnect提供者
  async initProvider() {
    try {
      this.provider = new WalletConnectProvider({
        rpc: {
          1: 'https://eth.llamarpc.com', // 主网
          5: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',  // Goerli测试网
          11155111: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Sepolia测试网
          137: 'https://polygon-rpc.com', // Polygon
          56: 'https://bsc-dataseed.binance.org', // BSC
        },
        qrcode: true,
        pollingInterval: 12000,
      });

      // 监听连接事件
      this.provider.on('connect', (error, payload) => {
        if (error) {
          console.error('WalletConnect连接错误:', error);
          return;
        }
        console.log('WalletConnect连接成功:', payload);
        this.isConnected = true;
        this.account = payload.params[0].accounts[0];
        this.chainId = payload.params[0].chainId;
      });

      // 监听断开连接事件
      this.provider.on('disconnect', (error, payload) => {
        console.log('WalletConnect断开连接:', payload);
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
      });

      // 监听账户变更事件
      this.provider.on('accountsChanged', (accounts) => {
        console.log('账户变更:', accounts);
        this.account = accounts[0];
      });

      // 监听链变更事件
      this.provider.on('chainChanged', (chainId) => {
        console.log('链变更:', chainId);
        this.chainId = chainId;
      });

      return this.provider;
    } catch (error) {
      console.error('初始化WalletConnect提供者失败:', error);
      throw error;
    }
  }

  // 连接到钱包
  async connect() {
    try {
      if (!this.provider) {
        await this.initProvider();
      }

      // 启用连接
      await this.provider.enable();
      
      // 创建ethers提供者
      this.ethersProvider = new ethers.BrowserProvider(this.provider);
      
      // 获取账户信息
      const accounts = await this.ethersProvider.listAccounts();
      if (accounts.length > 0) {
        this.account = accounts[0].address;
        this.isConnected = true;
        
        // 获取网络信息
        const network = await this.ethersProvider.getNetwork();
        this.chainId = network.chainId;
      }

      return {
        account: this.account,
        chainId: this.chainId,
        isConnected: this.isConnected
      };
    } catch (error) {
      console.error('WalletConnect连接失败:', error);
      throw error;
    }
  }

  // 断开连接
  async disconnect() {
    try {
      if (this.provider) {
        await this.provider.disconnect();
      }
      this.isConnected = false;
      this.account = null;
      this.chainId = null;
      this.ethersProvider = null;
    } catch (error) {
      console.error('WalletConnect断开连接失败:', error);
      throw error;
    }
  }

  // 签名消息
  async signMessage(message) {
    try {
      if (!this.ethersProvider || !this.account) {
        throw new Error('请先连接钱包');
      }

      const signer = this.ethersProvider.getSigner();
      const signature = await signer.signMessage(message);
      
      return {
        message,
        signature,
        address: this.account
      };
    } catch (error) {
      console.error('签名失败:', error);
      throw error;
    }
  }

  // 签名交易
  async signTransaction(transaction) {
    try {
      if (!this.ethersProvider || !this.account) {
        throw new Error('请先连接钱包');
      }

      const signer = this.ethersProvider.getSigner();
      const signedTx = await signer.signTransaction(transaction);
      
      return signedTx;
    } catch (error) {
      console.error('交易签名失败:', error);
      throw error;
    }
  }

  // 发送交易
  async sendTransaction(transaction) {
    try {
      if (!this.ethersProvider || !this.account) {
        throw new Error('请先连接钱包');
      }

      const signer = this.ethersProvider.getSigner();
      const tx = await signer.sendTransaction(transaction);
      const receipt = await tx.wait();
      
      return {
        hash: tx.hash,
        receipt
      };
    } catch (error) {
      console.error('发送交易失败:', error);
      throw error;
    }
  }

  // 获取余额
  async getBalance(address = null) {
    try {
      if (!this.ethersProvider) {
        throw new Error('请先连接钱包');
      }

      const targetAddress = address || this.account;
      if (!targetAddress) {
        throw new Error('没有有效的地址');
      }

      const balance = await this.ethersProvider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('获取余额失败:', error);
      throw error;
    }
  }

  // 获取网络信息
  async getNetwork() {
    try {
      if (!this.ethersProvider) {
        throw new Error('请先连接钱包');
      }

      const network = await this.ethersProvider.getNetwork();
      return {
        chainId: network.chainId,
        name: network.name
      };
    } catch (error) {
      console.error('获取网络信息失败:', error);
      throw error;
    }
  }

  // 检查是否在移动设备上
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // 检查是否在外部浏览器中
  isExternalBrowser() {
    return this.isMobileDevice() && !window.ethereum;
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId,
      isMobile: this.isMobileDevice(),
      isExternalBrowser: this.isExternalBrowser()
    };
  }
}

// 创建单例实例
const walletConnectService = new WalletConnectService();

export default walletConnectService; 