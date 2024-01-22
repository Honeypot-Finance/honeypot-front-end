import { Token } from './token'
import BigNumber from 'bignumber.js'
import { swap } from '../swap'
import { Signer, ethers } from 'ethers'
import { BaseContract } from '.'
import { Contract } from 'ethcall'
import { makeAutoObservable } from '~/lib/observer'
import { reaction, when } from '~/lib/event'
import { wallet } from '../wallet'
import { multicall } from './multicall'
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'

// const totalSupply = await pairContract.methods.totalSupply().call()
// const LPTokenBalance = await this.balanceOf(pairAddress)
// const LPtoken0Balance = reserve0 * LPTokenBalance / totalSupply
// const LPtoken1Balance = reserve1 * LPTokenBalance / totalSupply

export class PairContract implements BaseContract {
  address: string = ''
  name: string = ''
  abi: any[] = IUniswapV2Pair.abi
  token!: Token
  poolName: string = ''
  liquidity: string = ''
  totalSupply: BigNumber = new BigNumber(0)
  get readContract() {
    return new Contract(this.address, this.abi)
  }
  get contract() {
    return new ethers.Contract(this.address, this.abi, this.signer)
  }
  reserves: {
    reserve0: number
    reserve1: number
  }
  token0!: Token // fixed
  token1!: Token // fixed
  token0LpBalance: BigNumber = new BigNumber(0)
  token1LpBalance: BigNumber = new BigNumber(0)
  midPrice0: BigNumber = new BigNumber(1)
  midPrice1: BigNumber = new BigNumber(1)
  isInit = false

  get signer() {
    return wallet.signer
  }

  get routerV2Contract() {
    return wallet.currentNetwork.contracts.routerV2
  }

  constructor(args: Partial<PairContract>) {
    Object.assign(this, args)
    this.token = new Token({
      address: this.address,
    })
    this.init()
    when(
      () => this.token0?.isInit && this.token1?.isInit && this.isInit,
      () => {

        this.liquidity = `${this.token0LpBalance.toFixed(2)} ${
          this.token0.symbol
        } - ${this.token1LpBalance.toFixed(2)} ${this.token1.symbol}`
        this.poolName = this.token0.symbol + '-' + this.token1.symbol
      }
    )
    makeAutoObservable(this)
  }

  getFromAmount(toAmount) {
    return (
      new BigNumber(toAmount).multipliedBy(this.midPrice0).toFixed(2)
    )
  }
  getToAmount(fromAmount) {
    return new BigNumber(fromAmount).multipliedBy(this.midPrice1).toFixed(2)
  }

  async getReserves() {
    const reserves = await multicall.load(
      `${this.address}-getReserves`,
      this.readContract.getReserves()
    )
    this.reserves = reserves
  }

  async getTotalSupply() {
    const totalSupply = await multicall.load(
      `${this.address}-getTotalSupply`,
      this.readContract.totalSupply()
    )
    this.totalSupply = new BigNumber(totalSupply.toString() || 0)
  }

  async getToken0() {
    const token0 = await multicall.load(
      `${this.address}-getToken0`,
      this.readContract.token0()
    )
    this.token0 = new Token({
      address: token0,
    })
  }

  async getToken1() {
    const token1 = await multicall.load(
      `${this.address}-getToken1`,
      this.readContract.token1()
    )
    this.token1 = new Token({
      address: token1,
    })
  }

  async init() {
    await Promise.all([this.getReserves(), this.getToken0(), this.getToken1(), this.getTotalSupply()])
    await this.getPricing()
    await when(() => this.token.isInit)
    this.token0LpBalance = !new BigNumber(this.totalSupply || 0).eq(0) ? new BigNumber(this.reserves.reserve0.toString()).multipliedBy(this.token.balance).div(this.totalSupply) : new BigNumber(0)
    this.token1LpBalance =  !new BigNumber(this.totalSupply || 0).eq(0) ? new BigNumber(this.reserves.reserve1.toString()).multipliedBy(this.token.balance).div(this.totalSupply) : new BigNumber(0)
    this.isInit = true
  }
  async getPricing() {
    try {
      await when(
        () =>
          this.token0.isInit &&
          this.token1.isInit &&
          this.reserves.reserve0 &&
          this.reserves.reserve1
      )
      const [midPrice0, midPrice1] = await Promise.all([
        this.routerV2Contract.contract.getAmountOut(
          new BigNumber(1).multipliedBy(new BigNumber(10).pow(this.token0.decimals)).toFixed(),
          this.reserves.reserve0,
          this.reserves.reserve1
        ),
        this.routerV2Contract.contract.getAmountOut(
          new BigNumber(1).multipliedBy(new BigNumber(10).pow(this.token1.decimals)).toFixed(),
          this.reserves.reserve1,
          this.reserves.reserve0
        ),
      ])
      this.midPrice0 = new BigNumber(midPrice0.toString()).div(new BigNumber(10).pow(this.token1.decimals))
      this.midPrice1 = new BigNumber(midPrice1.toString()).div(new BigNumber(10).pow(this.token0.decimals))
    } catch(error) {
      console.error(error, `${this.token0.symbol}-${this.token1.symbol}-getPricing`)
      // this.$alert('cancel', 'Insuficient liquidity unable to swap ' + token0.symbol + "/" + token1.symbol)
    }
  }

  async removeLiquidity (percent) {
    await when(() => this.token.isInit)
    const liquidity = this.token.balance.multipliedBy(percent).div(100).multipliedBy(new BigNumber(10).pow(this.token.decimals))
    if(liquidity.gt(0)){
      await this.token.approve(liquidity.toFixed(), this.routerV2Contract.address)
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 mins time
      const args: any[] = [
        this.token0.address,
        this.token1.address,
        liquidity.toFixed(),
        0,
        0,
        wallet.account,
        deadline]
      const additionalGas = ethers.utils.parseUnits('5000', 'wei')
      // const estimatedGas = await this.routerV2Contract.contract.estimateGas.removeLiquidity(...args)
      let estimatedGas
      try {
        estimatedGas =
          await this.routerV2Contract.contract.estimateGas.removeLiquidity(...args)
      } catch (error) {}
      if (estimatedGas) {
        args.push({
          gasLimit: estimatedGas.add(additionalGas),
        })
      }
      const res =  await this.routerV2Contract.contract.removeLiquidity(
        ...args
      )
      await res.wait()
    }
  }
}
