import ERC20ABI from '~/static/abis/erc20.json'
import BigNumber from 'bignumber.js'
import { Signer, ethers } from 'ethers'
import { BaseContract } from '.'
import { Contract } from 'ethcall'
import faucetABI from '~/static/abis/faucet.json'
import { makeAutoObservable } from '~/lib/observer'
import { reaction, when } from '~/lib/event'
import { wallet } from '../wallet'
import { exec } from '~/lib/contract'
import { Multicall } from './multicall'

export class Token implements BaseContract {
  address: string = ''
  name: string = ''
  balance = new BigNumber(0)
  symbol: string = ''
  decimals!: number
  logoURI = ''
  abi = ERC20ABI
  faucetLoading = false
  isInit = false
  _multicall?: Multicall
  get signer() {
    return wallet.signer
  }
  get faucetContract() {
    return new ethers.Contract(this.address, faucetABI, this.signer)
  }
  get readContract() {
    return new Contract(this.address, this.abi)
  }
  get contract() {
    return new ethers.Contract(this.address, this.abi, this.signer)
  }

  get multicall () {
    return this._multicall || wallet.currentNetwork.multicall
  }

  constructor({ balance, address, ...args }: Partial<Token>) {
    Object.assign(this, args)
    if (balance) {
      this.balance = new BigNumber(balance)
    }
    this.address = address.toLowerCase()
    this.init()
    reaction(
      () => wallet.account,
      () => {
        this.getBalance()
      }
    )
    // reaction(() => wallet.currentChainId, () => {
    //   this.getBalance()
    // })
    makeAutoObservable(this)
  }

  async approve(amount: string, spender: string) {
    const allowance = await this.contract.allowance(wallet.account, spender)
    if (new BigNumber(allowance.toString()).gte(new BigNumber(amount))) {
      return
    }
    const args = [spender, amount]
    await exec(this.contract, 'approve', args)
  }

  async faucet() {
    const args = []
    await exec(this.faucetContract, 'faucet', args)
    await this.getBalance()
  }

  async getBalance() {
    await when(() => wallet?.account)
    const balance = await this.multicall.load(
      `${this.address}-${wallet.account}-getBalance`,
      this.readContract.balanceOf(wallet.account)
    )
    await when(() => this.decimals || this.decimals === 0)
    this.balance = balance
      ? new BigNumber(balance.toString()).div(
          new BigNumber(10).pow(this.decimals)
        )
      : new BigNumber(0)
      console.log('balance', this.balance.toString())
    return this.balance
  }

  async getName() {
    const name = await  this.multicall.load(
      `${this.address}-name`,
      this.readContract.name()
    )
    this.name = name
    return name
  }

  async getSymbol() {
    const symbol = await this.multicall.load(
      `${this.address}-symbol`,
      this.readContract.symbol()
    )
    this.symbol = symbol
    return symbol
  }

  async getDecimals() {
    const decimals = await this.multicall.load(
      `${this.address}-decimals`,
      this.readContract.decimals()
    )
    this.decimals = decimals
    return decimals
  }

  async init() {
    const tasks = [this.getBalance()]
    if (!this.name) {
      tasks.push(this.getName())
    }
    if (!this.symbol) {
      tasks.push(this.getSymbol())
    }
    if (!this.decimals && this.decimals !== 0) {
      tasks.push(this.getDecimals())
    }
    await Promise.all(tasks)
    this.isInit = true
    // multicall.load(`${this.address}-name`, this.readContract.name()),
    // multicall.load(`${this.address}-symbol`, this.readContract.symbol()),
    // multicall.load(`${this.address}-decimals`, this.readContract.decimals()),
    // if (name) {
    //   this.name = name
    // }
    // if (symbol) {
    //   this.symbol = symbol
    // }
    // if (decimals || decimals === 0) {
    //   this.decimals = decimals
    // }
  }
}
