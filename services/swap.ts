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

class Swap {
  fromToken: Token = wallet.currentNetwork.tokens[0]
  toToken: Token = wallet.currentNetwork.tokens[1]

  fromAmount: string = ''
  toAmount: string = ''

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

  get currentPair() {
    if (!this.fromToken || !this.toToken) {
      return null
    }
    return liquidity.pairsByToken[
      `${this.fromToken.address}-${this.toToken.address}`
    ]
  }

  get factoryContract() {
    return wallet.currentNetwork.contracts.factory
  }

  get routerV2Contract() {
    return wallet.currentNetwork.contracts.routerV2
  }

  constructor() {
    makeAutoObservable(this)
  }

  switchTokens() {
    const fromToken = this.fromToken
    this.fromToken = this.toToken
    this.toToken = fromToken
  }

  async swapExactTokensForTokens() {
    await this.toToken.approve(
      this.toAmountDecimals.toString(),
      this.routerV2Contract.address
    )
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 mins time
    const path = [swap.fromToken.address, swap.toToken.address]
    const args: any [] = [
      swap.toAmountDecimals.toString(),
      new BigNumber(swap.fromAmountDecimals)
        .minus(new BigNumber(swap.fromAmountDecimals).multipliedBy(0.015))
        .toString(),
      path,
      wallet.account,
      deadline,
    ]
    const additionalGas = ethers.utils.parseUnits('20000', 'wei')
    let estimatedGas
    try {
      estimatedGas =
        await this.routerV2Contract.contract.estimateGas.swapExactTokensForTokens(...args)
    } catch (error) {}
    if (estimatedGas) {
      args.push({
        gasLimit: estimatedGas.add(additionalGas),
      })
    }
    const res = await this.routerV2Contract.contract.swapExactTokensForTokens(
      ...args
    )
    await res.wait()
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
