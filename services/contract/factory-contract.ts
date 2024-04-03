import { exec } from '~/lib/contract';


import { BaseContract } from "."
import { wallet } from '../wallet';
import factoryABI from '~/static/abis/factory.json';
import Vue from "vue";
import { Signer, ethers } from "ethers";
import { Contract } from "ethcall";
import { makeAutoObservable } from "~/lib/observer";
import { reaction } from "~/lib/event";
import BigNumber from "bignumber.js";

export class FactoryContract implements BaseContract {
  address = ''
  name: string = ''
  abi: any[] = factoryABI
  get signer () {
    return wallet.signer
  }
  get readContract () {
    return new Contract(this.address, this.abi)
  }
  get contract() {
    return new ethers.Contract(this.address, this.abi, this.signer)
  }
  constructor(args: Partial<FactoryContract>) {
    Object.assign(this, args)
    makeAutoObservable(this)
  }

  get multicall () {
    return wallet.currentNetwork.multicall
  }

  allPairs (index: number) {
    return this.multicall.load(`${index}-allPairs`, this.readContract.allPairs(index), {
      cache: true
    })
  }

  allPairsLength () {
    return this.multicall.load(`allPairs`, this.readContract.allPairsLength())
  }

  async getPairByTokens (tokenA: string, tokenB: string) {
    tokenA = tokenA.toLowerCase()
    tokenB = tokenB.toLowerCase()
    const res = await this.multicall.load(`getPairByTokens-${tokenA}-${tokenB}`, this.readContract.getPair(tokenA, tokenB))
    return res
  }

  async launchToken ({tokenAddress, tokenName, tokenSymbol, tokenAmount, poolHandler, campaignDuration}) {
    const args: any [] = [
      tokenAddress,
      tokenName,
      tokenSymbol,
      new BigNumber(tokenAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(),
      poolHandler,
      campaignDuration
    ]
    await exec(this.contract, 'createFTO', args)
  }
}

