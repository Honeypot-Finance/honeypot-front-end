import { ethers } from 'ethers'
import Vue from 'vue'
import { Network, networks } from './chain'
import { makeAutoObservable } from '~/lib/observer'
import { StorePlugin } from '~/lib/observer/storePlugin'
import { reaction, when } from '~/lib/event'
import BigNumber from 'bignumber.js'

export class Wallet {
  account: string
  accountShort = ''
  isConnect = false
  ethereum: any = null
  currentChainId: string = ''
  networks = networks || []
  currentNetwork: Network = new Network({})
  balance: BigNumber = new BigNumber(0)
  provider: ethers.providers.Web3Provider

  get readProvider() {
     return this.currentNetwork?.readProvider
  }

  get networksMap() {
    return this.networks.reduce((acc, network) => {
      acc[network.chainId] = network
      return acc
    }, {})
  }

  // get currentNetwork() {
  //   return this.networksMap[this.currentChainId] || ({} as Network)
  // }

  get signer() {
    return this.provider.getSigner()
  }

  constructor({ account, currentChainId, ...args }: Partial<Wallet>) {
    this.provider = new ethers.providers.Web3Provider(window.ethereum)
    when(() => window.ethereum, () => {
      window.ethereum.on('chainChanged', this.handleChainChanged)
      window.ethereum.on('accountsChanged', this.handleAccountsChanged)
    })

    Object.assign(this, args)
    this.setAccount(account)
    reaction(() => this.account, () => {
      if (this.currentChainId && this.account && this.currentNetwork) {
        console.log('this.currentNetwork', this.currentNetwork)
        this.currentNetwork.getBalance(this.account)
      }
    })
    makeAutoObservable(this, [new StorePlugin({ observerKeys: ['currentChainId'], namespace: 'wallet', target: this})])
    reaction(() => this.currentChainId, () => {
      if (this.currentChainId) {
        this.currentNetwork =
        this.networksMap[this.currentChainId] || ({} as Network)
        this.currentNetwork.init()
        if (this.account && this.currentNetwork) {
          this.currentNetwork.getBalance(this.account)
        }
      }
    }, true)
  }
  //  signer:

  setCurrentNetwork(currentChainId: string) {
    this.currentChainId = currentChainId
  }


  setAccount(account: string) {
    if (account) {
      this.account = account
      this.accountShort = this.account.substring(0, 19) + '...'
      this.isConnect = !!this.account
    }
  }

  detectProvider() {
    //@ts-ignore
    return window?.ethereum?.isMetaMask
  }

  async addNetwork(chainId: string) {
    const network = this.networksMap[chainId]
    await  window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: network.chainId,
          chainName: network.chainName,
          rpcUrls: network.rpcUrls,
          blockExplorerUrls: network.blockExplorerUrls,
          nativeCurrency: network.nativeCurrency,
        },
      ],
    })
  }

  async switchToNetwork(chainId: string) {
    const isMetaMask = this.detectProvider()
    if (!isMetaMask) {
      alert('Please install MetaMask!')
      return
    }
    try {
      await  window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      })
    } catch (switchError) {
      console.error(switchError)
      // The network has not been added to MetaMask
      if (switchError.code === 4902) {
        this.addNetwork(chainId)
      }
    } finally {
      this.setCurrentNetwork(chainId)
    }
  }

  handleChainChanged = (chainId: string) => {
    if (!this.networksMap[chainId]) {
      alert('Please switch to Scroll network')
    }
    this.setCurrentNetwork(chainId)
  }

  handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts.
      console.log('Please connect to MetaMask.')
    } else if (accounts[0] !== this.account) {
      // Reload your interface with accounts[0].
      this.setAccount(accounts[0])
    }
  }

  async connect() {
    const isMetaMask = this.detectProvider()
    if (!isMetaMask) {
      alert('Please install MetaMask!')
      return
    }
    const accounts = await  window.ethereum.request({
      method: 'eth_requestAccounts',
      params: [],
    })
    this.handleAccountsChanged(accounts)
    const chainId = await  window.ethereum.request({ method: 'eth_chainId' })
    if (chainId !== this.currentChainId) {
      this.switchToNetwork(this.currentChainId)
    }
  }
}

export const wallet = new Wallet({
  currentChainId: networks?.[0].chainId
})
wallet.connect()
Vue.prototype.$wallet = wallet
