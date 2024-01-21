

import { BaseContract } from "."
import { Signer, ethers } from "ethers";
import { Contract } from "ethcall";
import faucetABI from '~/static/abis/faucet.json';
import { makeAutoObservable } from "~/lib/observer";
import { reaction } from "~/lib/event";
import { wallet } from "../wallet";

export class FaucetContract implements BaseContract {
  address: string = ''
  name: string = ''
  abi: any[] = faucetABI
  get signer () {
    return wallet.signer
  }
  get readContract () {
    return new Contract(this.address, this.abi)
  }
  get contract() {
    return new ethers.Contract(this.address, this.abi, this.signer)
  }

  constructor(args: Partial<FaucetContract>) {
    Object.assign(this, args)
    makeAutoObservable(this)
  }

}
