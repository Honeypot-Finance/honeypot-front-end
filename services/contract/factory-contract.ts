

import { BaseContract } from "."
import { wallet } from '../wallet';
import factoryABI from '~/static/abis/factory.json';
import Vue from "vue";
import { Signer, ethers } from "ethers";
import { Contract } from "ethcall";
import { makeAutoObservable } from "~/lib/observer";
import { reaction } from "~/lib/event";
import { multicall } from "./multicall";

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

  allPairs (index: number) {
    return multicall.load(`${index}-allPairs`, this.readContract.allPairs(index))
  }

}

