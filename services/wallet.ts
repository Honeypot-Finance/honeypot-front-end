import { ethers } from 'ethers'
import Vue from 'vue'
import { Network, networks } from './chain'
import { makeAutoObservable } from '~/lib/observer'
import { StorePlugin } from '~/lib/observer/storePlugin'
import { reaction, when } from '~/lib/event'
import BigNumber from 'bignumber.js'

export class Wallet {
  account: string = ''
  accountShort = ''
  isConnect = false
  ethereum: any = null
  currentChainId: string = ''
  networks = networks || []
  currentNetwork: Network
  balance: BigNumber = new BigNumber(0)

  get readProvider() {
     return this.currentNetwork?.readProvider
  }

  get networksMap() {
    return this.networks.reduce((acc, network) => {
      acc[network.chainId] = network
      return acc
    }, {})
  }

  get provider() {
    return new ethers.providers.Web3Provider(this.ethereum)
  }

  // get currentNetwork() {
  //   return this.networksMap[this.currentChainId] || ({} as Network)
  // }

  get signer() {
    return this.provider.getSigner()
  }

  constructor({ account, currentChainId, ...args }: Partial<Wallet>) {
    //@ts-ignore
    this.ethereum = window.ethereum
    when(() => this.ethereum, () => {
      this.ethereum.on('chainChanged', this.handleChainChanged)
      this.ethereum.on('accountsChanged', this.handleAccountsChanged)
    })

    Object.assign(this, args)
    if (account) {
      this.setAccount(account)
    }
    if (currentChainId) {
      this.setCurrentNetwork(currentChainId)
      this.currentNetwork =
      this.networksMap[this.currentChainId] || ({} as Network)
    }
    reaction(() => this.currentChainId, () => {
      if (this.currentChainId) {
        this.currentNetwork =
        this.networksMap[this.currentChainId] || ({} as Network)
        if (this.account) {
          this.currentNetwork.getBalance(this.account)
        }
      }

    })
    reaction(() => this.account, () => {
      if (this.currentChainId && this.account) {
        this.currentNetwork.getBalance(this.account)
      }
    })
    makeAutoObservable(this, [new StorePlugin({ observerKeys: ['currentChainId'], namespace: 'wallet', target: this})])
  }
  //  signer:

  setCurrentNetwork(currentChainId: string) {
    this.currentChainId = currentChainId
  }


  setAccount(account: string) {
    this.account = account
    this.accountShort = this.account.substring(0, 19) + '...'
    this.isConnect = !!this.account
  }

  detectProvider() {
    //@ts-ignore
    return window?.ethereum?.isMetaMask
  }

  async addNetwork(chainId: string) {
    const network = this.networksMap[chainId]
    await this.ethereum.request({
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
      await this.ethereum.request({
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
    const accounts = await this.ethereum.request({
      method: 'eth_requestAccounts',
      params: [],
    })
    this.handleAccountsChanged(accounts)
    const chainId = await this.ethereum.request({ method: 'eth_chainId' })
    if (chainId !== this.currentChainId) {
      this.switchToNetwork(this.currentChainId)
    }
  }
}

export const wallet = new Wallet({
  currentChainId: networks?.[0].chainId,
})
wallet.connect()
Vue.prototype.$wallet = wallet
