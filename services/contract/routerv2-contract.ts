
import routerV2ABI from '~/static/abis/routerv2.json';
import Vue from "vue";
import { Signer, ethers } from "ethers";
import { BaseContract } from ".";
import { Contract } from "ethcall";
import { makeAutoObservable } from "~/lib/observer";
import { reaction } from '~/lib/event';
import { wallet } from '../wallet';

export class RouterV2Contract implements BaseContract {
  address = ''
  name: string = ''
  abi: any[] = routerV2ABI
  get readContract () {
    return new Contract(this.address, this.abi)
  }
  get contract() {
    return new ethers.Contract(this.address, this.abi, this.signer)
  }

  get signer () {
    return wallet.signer
  }

  constructor(args: Partial<RouterV2Contract>) {
    Object.assign(this, args)
    makeAutoObservable(this)
  }
}

