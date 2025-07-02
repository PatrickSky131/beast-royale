import { ethers } from 'ethers';
import walletConnectService from './WalletConnectService.js';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.isConnected = false;
    this.walletType = null; // 'metamask', 'walletconnect', 'coinbase', etc.
    this.chainId = null;
  }

  // 检测可用的钱包
  detectWallets() {
    const wallets = [];
    
    // 检测是否为移动设备
    const isMobile = this.isMobileDevice();
    const isInMetaMaskBrowser = this.isInMetaMaskBrowser();
    
    if (isMobile) {
      if (isInMetaMaskBrowser) {
        // MetaMask内置浏览器：只显示MetaMask选项
        wallets.push({
          name: 'MetaMask',
          type: 'metamask',
          available: true,
          isMobile: true,
          isMetaMask: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
          hasProvider: typeof window.ethereum !== 'undefined',
          inMetaMaskBrowser: true
        });
      } else {
        // 外部浏览器：只显示WalletConnect选项
        wallets.push({
          name: 'WalletConnect',
          type: 'walletconnect',
          available: true,
          isMobile: true,
          description: '通过二维码连接移动钱包'
        });
      }
    } else {
      // 桌面端：检测实际的钱包扩展
      if (typeof window.ethereum !== 'undefined') {
        wallets.push({
          name: 'MetaMask',
          type: 'metamask',
          available: true,
          isMetaMask: window.ethereum.isMetaMask
        });
      }

      // 桌面端也可以使用WalletConnect
      wallets.push({
        name: 'WalletConnect',
        type: 'walletconnect',
        available: true,
        isMobile: false,
        description: '通过二维码连接移动钱包'
      });
    }
    
    // 检测其他钱包（桌面和移动端都检测）
    if (typeof window.ethereum !== 'undefined') {
      // 检测Coinbase Wallet
      if (window.ethereum.isCoinbaseWallet) {
        wallets.push({
          name: 'Coinbase Wallet',
          type: 'coinbase',
          available: true
        });
      }
      
      // 检测其他EIP-1193兼容的钱包
      if (window.ethereum.isTrust) {
        wallets.push({
          name: 'Trust Wallet',
          type: 'trust',
          available: true
        });
      }
    }
    
    return wallets;
  }

  // 连接到钱包
  async connect(walletType = 'auto') {
    try {
      const isMobile = this.isMobileDevice();
      const isInMetaMaskBrowser = this.isInMetaMaskBrowser();
      
      // 如果指定了WalletConnect
      if (walletType === 'walletconnect') {
        return await this.connectViaWalletConnect();
      }
      
      // 移动端特殊处理
      if (isMobile) {
        if (isInMetaMaskBrowser) {
          // MetaMask内置浏览器，只支持MetaMask连接
          if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask内置浏览器中未检测到ethereum对象');
          }
          // 继续执行标准MetaMask连接流程
        } else {
          // 外部浏览器，只支持WalletConnect
          if (walletType === 'auto') {
            return await this.connectViaWalletConnect();
          } else if (walletType === 'metamask') {
            throw new Error('外部浏览器中不支持MetaMask连接，请使用WalletConnect');
          } else {
            return await this.connectViaWalletConnect();
          }
        }
      }
      
      // 标准连接流程（桌面端或MetaMask内置浏览器）
      if (typeof window.ethereum === 'undefined') {
        if (isMobile) {
          // 移动端没有window.ethereum时，提供WalletConnect选项
          throw new Error('检测到移动设备，建议使用WalletConnect连接');
        } else {
          throw new Error('未检测到钱包，请安装MetaMask或其他兼容的钱包');
        }
      }

      // 请求连接
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('没有找到钱包账户');
      }

      // 创建provider和signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = accounts[0];
      this.isConnected = true;
      
      // 根据实际情况确定钱包类型
      if (window.ethereum.isMetaMask) {
        this.walletType = isMobile ? 'metamask_mobile' : 'metamask';
      } else if (window.ethereum.isCoinbaseWallet) {
        this.walletType = 'coinbase';
      } else if (window.ethereum.isTrust) {
        this.walletType = 'trust';
      } else {
        this.walletType = 'ethereum'; // 通用EIP-1193钱包
      }

      // 获取网络信息
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;

      // 监听账户变更
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      
      // 监听链变更
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

      return {
        account: this.account,
        chainId: this.chainId,
        isConnected: this.isConnected,
        walletType: this.walletType
      };
    } catch (error) {
      console.error('连接钱包失败:', error);
      throw error;
    }
  }

  // 通过WalletConnect连接
  async connectViaWalletConnect() {
    try {
      console.log('使用WalletConnect连接...');
      
      const result = await walletConnectService.connect();
      
      // 更新当前服务状态
      this.account = result.account;
      this.chainId = result.chainId;
      this.isConnected = result.isConnected;
      this.walletType = 'walletconnect';
      this.provider = walletConnectService.ethersProvider;
      this.signer = await this.provider.getSigner();

      return result;
    } catch (error) {
      console.error('WalletConnect连接失败:', error);
      throw error;
    }
  }

  // 生成MetaMask深链接
  generateMetaMaskDeepLink() {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const currentPath = window.location.pathname + window.location.search;
    return `https://metamask.app.link/dapp/${window.location.host}${currentPath}`;
  }

  // 检测是否为移动设备
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // 检测是否在MetaMask内置浏览器中
  isInMetaMaskBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('metamask') || userAgent.includes('web3');
  }

  // 检测是否在外部浏览器中
  isExternalBrowser() {
    return this.isMobileDevice() && !this.isInMetaMaskBrowser() && typeof window.ethereum === 'undefined';
  }

  // 签名消息
  async signMessage(message) {
    try {
      if (this.walletType === 'walletconnect') {
        return await walletConnectService.signMessage(message);
      }

      if (!this.signer || !this.account) {
        throw new Error('请先连接钱包');
      }

      const signature = await this.signer.signMessage(message);
      
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

  // 断开连接
  async disconnect() {
    try {
      if (this.walletType === 'walletconnect') {
        await walletConnectService.disconnect();
      }
      
      this.provider = null;
      this.signer = null;
      this.account = null;
      this.isConnected = false;
      this.walletType = null;
      this.chainId = null;
      
      console.log('钱包已断开连接');
    } catch (error) {
      console.error('断开连接失败:', error);
      throw error;
    }
  }

  // 获取余额
  async getBalance(address = null) {
    try {
      if (this.walletType === 'walletconnect') {
        return await walletConnectService.getBalance(address);
      }

      if (!this.provider) {
        throw new Error('请先连接钱包');
      }

      const targetAddress = address || this.account;
      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('获取余额失败:', error);
      throw error;
    }
  }

  // 获取网络信息
  async getNetwork() {
    try {
      if (this.walletType === 'walletconnect') {
        return await walletConnectService.getNetwork();
      }

      if (!this.provider) {
        throw new Error('请先连接钱包');
      }

      return await this.provider.getNetwork();
    } catch (error) {
      console.error('获取网络信息失败:', error);
      throw error;
    }
  }

  // 处理账户变更
  handleAccountsChanged(accounts) {
    console.log('账户变更:', accounts);
    if (accounts.length === 0) {
      this.disconnect();
    } else {
      this.account = accounts[0];
    }
  }

  // 处理链变更
  handleChainChanged(chainId) {
    console.log('链变更:', chainId);
    this.chainId = chainId;
    // 重新加载页面以确保dapp与新链正常工作
    window.location.reload();
  }

  // 获取连接状态
  getConnectionStatus() {
    if (this.walletType === 'walletconnect') {
      return walletConnectService.getConnectionStatus();
    }

    return {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId,
      walletType: this.walletType,
      isMobile: this.isMobileDevice(),
      isExternalBrowser: this.isExternalBrowser(),
      isInMetaMaskBrowser: this.isInMetaMaskBrowser()
    };
  }
}

// 创建单例实例
const web3Service = new Web3Service();

export default web3Service; 