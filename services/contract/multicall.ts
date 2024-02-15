// eslint-disable-next-line import/named
import { Call, Contract, Provider } from 'ethcall'
import { wallet } from '../wallet'
import Vue from 'vue'
import { when } from '~/lib/event'
import pRetry from 'p-retry'

export class Multicall {
  get address() {
    return wallet.currentNetwork.multicallAddress
  }
  cache = new Map()
  lock = false
  limit = 10
  tasks: {
    key: string
    call: any
    resolve: any
    result?: any
    reject: any
  }[] = []
  get provider() {
    const provider = new Provider()
    // @ts-ignore
    provider.multicall3 = {
      address: this.address,
    }
    provider.init(wallet.readProvider)
    return provider
  }

  async tryAll(calls: Call[]) {
    return this.provider.tryAll(calls)
  }

  async load(key: string, call: any) {
    key = `${wallet?.currentChainId}-${key}`
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    const res = new Promise((resolve, reject) => {
      this.tasks.push({
        key,
        call,
        resolve,
        reject,
      })
    })
    this.cache.set(key, res)
    if (!this.lock) {
      setTimeout(async () => {
        const tasks = this.tasks
        this.tasks = []
        this.cache.clear()
        this.lock = false
        const data = await this.tryAll(tasks.map((t) => t.call))
        tasks.forEach((t, index) => {
          t.result = data[index]
          t.resolve(data[index])
        })
      }, 1000)
    }
    this.lock = true
    return res
  }
}

export const multicall = new Multicall()
Vue.prototype.$multicall = multicall
