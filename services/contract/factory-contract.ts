

import { BaseContract } from "."
import { wallet } from '../wallet';
import factoryABI from '~/static/abis/factory.json';
import Vue from "vue";
import { Signer, ethers } from "ethers";
import { Contract } from "ethcall";
import { makeAutoObservable } from "~/lib/observer";
import { reaction } from "~/lib/event";

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
    return this.multicall.load(`${index}-allPairs`, this.readContract.allPairs(index))
  }

}

