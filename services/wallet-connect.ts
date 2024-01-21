
import Vue from 'vue'
import { makeAutoObservable } from '~/lib/observer'


class WalletConnect {
  open: boolean = false

  toggle (open?: boolean) {
    this.open = open || !this.open
  }

  constructor() {
     makeAutoObservable(this)
  }

}
export const walletConnect = new WalletConnect()
Vue.prototype.$walletConnect = walletConnect
