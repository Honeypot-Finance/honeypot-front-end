// eslint-disable-next-line import/named
import { Call, Contract, Provider } from 'ethcall'
import { wallet } from '../wallet'
import Vue from 'vue'
import { when } from '~/lib/event'
import pRetry from 'p-retry'
import { ethers } from 'ethers'
import chunk from 'lodash/chunk'
export class Multicall {
  address!:string
  cache = new Map()
  lock = false
  limit = 20
  block: number
  tasks: {
    key: string
    call: any
    resolve: any
    result?: any
    reject: any
  }[] = []
  readProvider: ethers.providers.Provider
  get provider() {
    const provider = new Provider()
    // @ts-ignore
    provider.multicall3 = {
      address: this.address,
      block: this.block,
    }
    if (this.readProvider) {
      provider.init(this.readProvider)
      return provider
    }
  }

  constructor(args: Partial<Multicall>) {
    Object.assign(this, args)
  }

  async tryAll(calls: Call[]) {
    return this.provider.all(calls)
  }

  async load(key: string, call: any) {
    await when(() => wallet?.currentChainId && this.provider)
    key = `${wallet?.currentChainId}-${key}`
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    const res = this.addQueue(key, call)
    if (!this.lock) {
      this.processQueue()
    }
    this.lock = true
    return res
  }

  addQueue(key: string, call: any) {
    const res = new Promise((resolve, reject) => {
      this.tasks.push({
        key,
        call,
        resolve,
        reject,
      })
    })
    this.cache.set(key, res)
    return res
  }
  processQueue () {
    setTimeout(async () => {
      const tasks = this.tasks
      this.tasks = []
      this.cache.clear()
      this.lock = false
      chunk(tasks, this.limit).forEach(async (chunkTasks) => {
        const data = await this.tryAll(chunkTasks.map((t) => t.call))
        chunkTasks.forEach((t, index) => {
          t.result = data[index]
          t.resolve(data[index])
        })
      })
    }, 500)

  }
}

