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
  pairsTokensMap = {}
  token0Amount: string = ''
  token1Amount: string = ''
  currentPair: PairContract | null = null

  liquidityLoading = false

  currentRemovePair: PairContract | null = null

  get tokens() {
    return tokensConfig[wallet.currentChainId].map((t) => new Token(t))
  }

  get routerV2Contract() {
    return wallet.currentNetwork.contracts.routerV2
  }

  get factoryContract() {
    return wallet.currentNetwork.contracts.factory
  }


  constructor() {
    when(
      () => wallet.currentNetwork?.isInit && wallet.currentChainId,
      () => {
        this.token0 = wallet.currentNetwork.tokens[0]
        this.token1 = wallet.currentNetwork.tokens[1]
        this.getPools()
      }
    )
    reaction(() => this.token0?.address + this.token1?.address, async () => {
      if (!this.token0?.address || !this.token1?.address) {
        return null
      }
      this.currentPair = await liquidity.getPairByToken(this.token0.address, this.token1.address)
    }, true)
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
    const args: any[] = [
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

  async resetPool(tokenPair: string) {
    const pair = this.pairsByToken[tokenPair]
    await pair.init()
  }

  async getPools() {
    try {
      this.liquidityLoading = true
      const poolsLength = await this.factoryContract.allPairsLength()
      const poolAddresses = await Promise.all(
        Array.from({ length: poolsLength }).map((i, index) => {
          return this.factoryContract.allPairs(index)
        })
      )
      this.pairs = await Promise.all(
        poolAddresses.slice(0, 10).map(async (poolAddress) => {
          const pairContract = new PairContract({
            address: poolAddress,
          })
          return pairContract
        })
      )
      // .filter((pair) => pair.token.balance.gt(0))
      this.pairsByToken = (
        await Promise.all(
          this.pairs.map(async (pair) => {
            await pair.init()
            return pair
          })
        )
      ).reduce((acc, cur) => {
        this.pairsTokensMap[cur.token0.address] = cur.token0
        this.pairsTokensMap[cur.token1.address] = cur.token1
        return acc
      }, {})
      this.pairsTokens = Object.values(this.pairsTokensMap)
      console.log('this.pairsTokens', this.pairsTokens)
      swap.fromToken = this.pairs[0]?.token0 || new Token({})
      swap.toToken = this.pairs[0]?.token1 || new Token({})
    } catch (error) {
      console.error(error, 'this.liquidityLoading')
    }
    this.liquidityLoading = false
  }

  async getPairByToken(token0Address: string, token1Address?: string) {
    const defaultPairTokens = wallet.currentNetwork.defaultPairTokens
    token1Address = token1Address || defaultPairTokens?.[0]
    if (!token1Address) {
      return null
    }
    token0Address = token0Address.toLowerCase()
    token1Address = token1Address.toLowerCase()
    if (
      this.pairsByToken[`${token0Address}-${token1Address}`] ||
      this.pairsByToken[`${token1Address}-${token0Address}`]
    ) {
      const pairContract =
        this.pairsByToken[`${token0Address}-${token1Address}`]
      await when(() => pairContract.isInit)
      return pairContract
    }
    const pairAddress = await this.factoryContract.getPairByTokens(
      token0Address,
      token1Address
    )
    if (pairAddress === ethers.constants.AddressZero) {
      return
    }
    const pairContract = new PairContract({ address: pairAddress })
    pairContract.init()
    this.pairsByToken[`${token0Address}-${token1Address}`] = pairContract
    if (!this.pairsTokensMap[token0Address]) {
      this.pairsTokensMap[token0Address] = new Token({ address: token0Address })
    }
    if (!this.pairsTokensMap[token1Address]) {
      this.pairsTokensMap[token1Address] = new Token({ address: token1Address })
    }
    this.pairsTokens = Object.values(this.pairsTokensMap)
    await when(() => pairContract.isInit)
    return pairContract
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
