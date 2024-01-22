// eslint-disable-next-line import/named
import { Call, Contract, Provider } from 'ethcall'
import { wallet } from '../wallet'
import Vue from 'vue'
import { when } from '~/lib/event'
import pRetry from 'p-retry'

export class Multicall {
  address = '0xcA11bde05977b3631167028862bE2a173976CA11'
  cache = new Map()
  lock = false
  tasks: {
    key: string
    call: any
    resolve: any
    reject: any
  }[] = []
  get provider() {
    const provider = new Provider()
    provider.init(wallet.readProvider)
    return provider
  }

  async tryAll(calls: Call[]) {
    return pRetry(() => this.provider.tryAll(calls), {
      retries:2
    })
  }

  async load(key: string, call: any) {
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
        this.cache.clear()
        this.lock = false
        const tasks = this.tasks
        this.tasks = []

        const data = await this.tryAll(tasks.map((t) => t.call))
        tasks.forEach((t, index) => {
          t.resolve(data[index])
        })
      }, 200)
    }
    this.lock = true
    return res
  }
}

export const multicall = new Multicall()
Vue.prototype.$multicall = multicall
