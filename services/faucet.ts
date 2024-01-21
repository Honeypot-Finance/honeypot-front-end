// import faucetTokens from '~/static/tokens/scroll_alpha_tokens.json'

import { makeAutoObservable } from '~/lib/observer'
import { Token } from './contract/token'
import Vue from 'vue'


class Faucet {
  //  tokens = faucetTokens.map(t => new Token(t as any as Token))
   constructor() {
    makeAutoObservable(this)
   }
}
export const faucet = new Faucet()
Vue.prototype.$faucet = faucet
