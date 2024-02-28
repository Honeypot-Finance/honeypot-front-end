import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'
// import scrollTokens from '~/static/tokens/scroll_tokens.json'
// import scrollSepoliaTokens from '~/static/tokens/scroll_alpha_tokens.json'
import { wallet } from './wallet'
import { Token } from './contract/token'
import Vue from 'vue'
import { BaseContract } from './contract'
import { ethers } from 'ethers'
import { PairContract } from './contract/pair-contract'
import BigNumber from 'bignumber.js'
import { makeAutoObservable } from '~/lib/observer'
import { reaction, when } from '~/lib/event'
import { exec } from '~/lib/contract'
import { swap } from './swap'

const tokensConfig = {
  // [mainNetwork.chainId]: scrollTokens,
  // [testNetwork.chainId]: scrollSepoliaTokens
}

class Pair {
  address: string
  contract: BaseContract
}

class Liquidity {
  pairs: PairContract[] = []
  pairsByToken: Record<string, PairContract>
  pairsTokens: Token[] = []
  token0: Token = new Token({})
  token1: Token = new Token({})
  token: Token = new Token({})

  token0Amount: string = ''
  token1Amount: string = ''


  liquidityLoading = false

  currentRemovePair: PairContract | null  =  null

  get tokens() {
    return tokensConfig[wallet.currentChainId].map((t) => new Token(t))
  }

  get routerV2Contract() {
    return wallet.currentNetwork.contracts.routerV2
  }

  get factoryContract() {
    return wallet.currentNetwork.contracts.factory
  }

  get currentPair() {
    if (!this.token0 || !this.token1) {
      return null
    }
    return this.pairsByToken?.[`${this.token0.address}-${this.token1.address}`]
  }

  constructor() {
    reaction(() => wallet.currentNetwork, () => {
      this.token0 = wallet.currentNetwork.tokens[0]
      this.token1 = wallet.currentNetwork.tokens[1]
      if (wallet.account) {
        this.getPools()
      }
    }, true)
    reaction(() => wallet.account, () => {
      if (wallet.currentChainId) {
        this.getPools()
      }
    })
    makeAutoObservable(this)
  }

  setCurrentRemovePair(pair: PairContract) {
    this.currentRemovePair = new PairContract(pair)
  }

  switchTokens() {
    const token0 = this.token0
    this.token0 = this.token1
    this.token1 = token0
  }

  async addLiquidity(
    token0: Token,
    token1: Token,
    token0Amount: string,
    token1Amount: string
  ) {
    await when(() => token0.isInit && token1.isInit)
    const token0AmountWithDec = new BigNumber(token0Amount)
      .multipliedBy(new BigNumber(10).pow(token0.decimals))
      .toFixed()
    const token1AmountWithDec = new BigNumber(token1Amount)
      .multipliedBy(new BigNumber(10).pow(token1.decimals))
      .toFixed()
    await Promise.all([
      token0.approve(token0AmountWithDec, this.routerV2Contract.address),
      token1.approve(token1AmountWithDec, this.routerV2Contract.address),
    ])
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 mins time
    const args: any [] = [
      token0.address,
      token1.address,
      token0AmountWithDec,
      token1AmountWithDec,
      0,
      0,
      wallet.account,
      deadline,
    ]
    await exec(this.routerV2Contract.contract, 'addLiquidity', args)
    await Promise.all([this.token0.getBalance(), this.token1.getBalance()])
  }

  async resetPool (tokenPair: string) {
     const pair  =  this.pairsByToken[tokenPair]
     await pair.init()
  }

  async getPools() {
    try {
      this.liquidityLoading = true
      const pairsTokensMap = {}
      const poolsLength = await this.factoryContract.allPairsLength()
      const poolAddresses = await Promise.all(
        Array.from({ length: poolsLength }).map((i, index) => {
          return this.factoryContract.allPairs(index)
        })
      )
      this.pairs = (await Promise.all(poolAddresses.map(async (poolAddress) => {
        const pairContract = new PairContract({
          address: poolAddress,
        })
        pairContract.initToken()
        await when(() => pairContract.token.isInit)

        return pairContract
      })))
      // .filter((pair) => pair.token.balance.gt(0))
      this.pairsByToken = (
        await Promise.all(
          this.pairs.map(async (pair) => {
            await pair.init()
            return pair
          })
        )
      ).reduce((acc, cur) => {
        pairsTokensMap[cur.token0.address] = cur.token0
        pairsTokensMap[cur.token1.address] = cur.token1
        acc[`${cur.token0.address}-${cur.token1.address}`] = cur
        acc[`${cur.token1.address}-${cur.token0.address}`] = cur
        return acc
      }, {})
      this.pairsTokens = Object.values(pairsTokensMap)
      console.log('this.pairsTokens', this.pairsTokens)
      swap.fromToken = this.pairs[0]?.token0 || new Token({})
      swap.toToken = this.pairs[0]?.token1 || new Token({})
    } catch (error) {
      console.error(error,'this.liquidityLoading')
    }
    this.liquidityLoading = false
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

export const liquidity = new Liquidity()
Vue.prototype.$liquidity = liquidity
