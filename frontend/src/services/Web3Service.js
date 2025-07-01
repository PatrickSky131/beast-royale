import { ethers } from 'ethers';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
    this.walletType = null; // 'metamask', 'walletconnect', 'coinbase', etc.
  }

  // 检测可用的钱包
  detectWallets() {
    const wallets = [];
    
    // 检测是否为移动设备
    const isMobile = this.isMobileDevice();
    
    if (isMobile) {
      // 移动端：总是显示MetaMask选项，因为可以通过深链接唤起
      wallets.push({
        name: 'MetaMask',
        type: 'metamask',
        available: true,
        isMobile: true,
        isMetaMask: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
        hasProvider: typeof window.ethereum !== 'undefined',
        inMetaMaskBrowser: this.isInMetaMaskBrowser()
      });
      
      // 如果不在MetaMask浏览器中，提供深链接选项
      if (!this.isInMetaMaskBrowser()) {
        wallets.push({
          name: 'MetaMask 深链接',
          type: 'metamask_deeplink',
          available: true,
          isMobile: true,
          description: '通过深链接在MetaMask应用中打开'
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
      
      // 移动端特殊处理
      if (isMobile && !this.isInMetaMaskBrowser()) {
        // 在外部浏览器中，尝试通过深链接连接
        return await this.connectViaMobileDeepLink();
      }
      
      // 标准连接流程（桌面端或MetaMask内置浏览器）
      if (typeof window.ethereum === 'undefined') {
        if (isMobile) {
          throw new Error('请在MetaMask应用内置浏览器中打开此页面，或安装MetaMask应用');
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

  // 移动端深链接连接
  async connectViaMobileDeepLink() {
    try {
      // 构建MetaMask深链接
      const currentUrl = encodeURIComponent(window.location.href);
      const metamaskDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}${window.location.search}`;
      
      // 显示连接指引
      const userConfirmed = confirm(
        '要连接MetaMask钱包，请:\n\n' +
        '1. 点击"确定"跳转到MetaMask应用\n' +
        '2. 在MetaMask中授权连接\n' +
        '3. 返回此页面完成连接\n\n' +
        '点击"取消"手动输入钱包地址'
      );
      
      if (userConfirmed) {
        // 尝试打开MetaMask应用
        window.location.href = metamaskDeepLink;
        
        // 抛出特殊错误，告知用户正在跳转
        throw new Error('正在跳转到MetaMask应用，请在应用中完成连接后返回此页面');
      } else {
        // 用户选择手动连接
        throw new Error('manual_connection_needed');
      }
    } catch (error) {
      console.error('移动端深链接连接失败:', error);
      throw error;
    }
  }

  // 生成MetaMask深链接
  generateMetaMaskDeepLink() {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const currentPath = window.location.pathname + window.location.search;
    return `https://metamask.app.link/dapp/${window.location.host}${currentPath}`;
  }

  // 处理账户变更
  handleAccountsChanged(accounts) {
    console.log('账户变更:', accounts);
    if (accounts.length === 0) {
      // 用户断开了连接
      this.disconnect();
    } else {
      this.account = accounts[0];
    }
  }

  // 处理链变更
  handleChainChanged(chainId) {
    console.log('链变更:', chainId);
    this.chainId = parseInt(chainId, 16);
    // 刷新页面以应用新链
    window.location.reload();
  }

  // 断开连接
  disconnect() {
    this.isConnected = false;
    this.account = null;
    this.chainId = null;
    this.provider = null;
    this.signer = null;
    this.walletType = null;
  }

  // 签名消息
  async signMessage(message) {
    try {
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

  // 签名交易
  async signTransaction(transaction) {
    try {
      if (!this.signer || !this.account) {
        throw new Error('请先连接钱包');
      }

      const signedTx = await this.signer.signTransaction(transaction);
      return signedTx;
    } catch (error) {
      console.error('交易签名失败:', error);
      throw error;
    }
  }

  // 发送交易
  async sendTransaction(transaction) {
    try {
      if (!this.signer || !this.account) {
        throw new Error('请先连接钱包');
      }

      const tx = await this.signer.sendTransaction(transaction);
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
      if (!this.provider) {
        throw new Error('请先连接钱包');
      }

      const targetAddress = address || this.account;
      if (!targetAddress) {
        throw new Error('没有有效的地址');
      }

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
      if (!this.provider) {
        throw new Error('请先连接钱包');
      }

      const network = await this.provider.getNetwork();
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

  // 检查是否在MetaMask内置浏览器中
  isInMetaMaskBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('metamask') || userAgent.includes('web3');
  }

  // 检查是否在外部浏览器中
  isExternalBrowser() {
    return this.isMobileDevice() && !this.isInMetaMaskBrowser();
  }

  // 获取连接状态
  getConnectionStatus() {
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

  // 检查是否已连接
  async checkConnection() {
    try {
      if (typeof window.ethereum === 'undefined') {
        return false;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts.length > 0) {
        // 如果检测到已连接的账户，重新初始化连接
        await this.connect();
        return true;
      }

      return false;
    } catch (error) {
      console.error('检查连接状态失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const web3Service = new Web3Service();

export default web3Service; 