import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'
// import scrollTokens from '~/static/tokens/scroll_tokens.json'
// import scrollSepoliaTokens from '~/static/tokens/scroll_alpha_tokens.json'
import { Token } from './contract/token'
import Vue from 'vue'
import { BaseContract } from './contract'
import { ethers } from 'ethers'
import { PairContract } from './contract/pair-contract'
import BigNumber from 'bignumber.js'
import { Wallet, wallet } from './wallet'
import { makeAutoObservable } from '~/lib/observer'
import { liquidity } from './liquidity'
import { reaction, when } from '~/lib/event'
import { exec } from '~/lib/contract'

class Swap {
  fromToken: Token = new Token({})
  toToken: Token = new Token({})

  fromAmount: string = ''
  toAmount: string = ''

  currentPair: PairContract = null

  get fromAmountDecimals() {
    return this.fromToken
      ? new BigNumber(this.fromAmount)
          .multipliedBy(new BigNumber(10).pow(this.fromToken.decimals))
          .toFixed()
      : undefined
  }

  get toAmountDecimals() {
    return this.toToken
      ? new BigNumber(this.toAmount).multipliedBy(
          new BigNumber(10).pow(this.toToken.decimals)
        )
      : undefined
  }

  get tokens() {
    return wallet.currentNetwork.tokens || []
  }

  get fromTokens() {
    if (!this.toToken) {
      return this.tokens
    }
    return this.tokens?.filter((t) => t.address !== this.toToken.address) || []
  }

  get toTokens() {
    if (!this.fromToken) {
      return this.tokens
    }
    return (
      this.tokens?.filter((t) => t.address !== this.fromToken.address) || []
    )
  }

  get toLpSupply () {
    return this.currentPair?.token0?.address?.toLocaleLowerCase() === this.fromToken.address?.toLocaleLowerCase() ? this.currentPair?.token1LpSupply : this.currentPair?.token0LpSupply
  }


  get factoryContract() {
    return wallet.currentNetwork.contracts.factory
  }

  get routerV2Contract() {
    return wallet.currentNetwork.contracts.routerV2
  }

  constructor() {
    reaction(() => this.fromToken.address,async () => {
      if (!this.fromToken.address || !this.toToken.address) {
        return null
      }
      this.fromAmount = ''
      // console.log('')
      this.currentPair = await liquidity.getPairByToken(this.fromToken.address, this.toToken.address)
    })
    reaction(() => this.toToken.address, async () => {
      if (!this.fromToken.address || !this.toToken.address) {
        return null
      }
      this.toAmount = ''
      this.currentPair = await liquidity.getPairByToken(this.fromToken.address, this.toToken.address)
    })
    when(() => liquidity?.pairsByToken && this.fromToken.address && this.toToken.address, async () => {
      // console.log('when', liquidity.pairsByToken, `${this.fromToken.address}-${this.toToken.address}`)
      this.currentPair = await liquidity.getPairByToken(this.fromToken.address, this.toToken.address)
    })
    reaction(() => this.fromAmount, () => {
      if (this.currentPair) {
        this.toAmount = this.currentPair.getToAmount(this.fromToken, this.fromAmount).toFixed()
      }

    })
    makeAutoObservable(this)
  }

  switchTokens() {
    const fromToken = this.fromToken
    this.fromToken = this.toToken
    this.toToken = fromToken
  }

  swapValidate () {
    if (this.toLpSupply.lt(this.toAmount)) {
      return 'Insufficient liquidity'
   }
   return true
  }

  async swapExactTokensForTokens() {
    await this.fromToken.approve(
      this.fromAmountDecimals.toString(),
      this.routerV2Contract.address
    )
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 mins time
    const path = [swap.fromToken.address, swap.toToken.address]
    const args: any [] = [
      swap.fromAmountDecimals.toString(),
      new BigNumber(swap.toAmountDecimals)
        .minus(new BigNumber(swap.toAmountDecimals).multipliedBy(0.015))
        .toFixed(0),
      path,
      wallet.account,
      deadline,
    ]
    await exec(this.routerV2Contract.contract, 'swapExactTokensForTokens', args)
    await Promise.all([liquidity.resetPool(`${this.fromToken.address}-${this.toToken.address}`), this.fromToken.getBalance(), this.toToken.getBalance()])
    return true
  }

  // async getPairs () {
  //   const pair = {}
  //   pair.address = await factoryContract.contract.allPairs().call()
  //   const balance = await this.balanceOf(pair.address)
  //     const userHasBalance = balance > 0
  //     if(userHasBalance) {

  //       const pairContract = new web3.eth.Contract(IUniswapV2Pair.abi, pair.address);
  //       const [token0Address, token1Address] = await Promise.all([
  //       pairContract.methods.token0().call(),
  //       pairContract.methods.token1().call()])

  //       const [token0, token1, {LPtoken0Balance, LPtoken1Balance}] = await Promise.all([
  //         this.getTokenData(token0Address),
  //         this.getTokenData(token1Address),
  //         this.getUserPoolBalance(pair.address)
  //       ])
  //       pair.token0 = token0
  //       pair.token0Balance = LPtoken0Balance / 10 ** token0.decimals
  //       pair.token1 = token1
  //       pair.token1Balance = LPtoken1Balance / 10 ** token1.decimals
  //       pair.poolName = pair.token0.symbol + "-" + pair.token1.symbol
  //   }
  //   return pair
  //  }
}

export const swap = new Swap()
Vue.prototype.$swap = swap
