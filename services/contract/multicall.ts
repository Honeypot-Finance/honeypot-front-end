// eslint-disable-next-line import/named
import { Call, Provider } from 'ethcall';
import { wallet } from '../wallet'
import { when } from '~/lib/event'
import { ethers } from 'ethers'
import chunk from 'lodash/chunk'

interface Config {
  cache: {
     ttl: number
  } | boolean
}
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
    config?: Config
  }[] = []
  readProvider!: ethers.providers.Provider
  provider: any
  constructor(args: Partial<Multicall>) {
    Object.assign(this, args)
    const provider = new Provider()
    // @ts-ignore
    provider.multicall3 = {
      address: this.address,
      block: this.block,
    }
    if (this.readProvider) {
      provider.init(this.readProvider)
      this.provider = provider
    }
  }

  async tryAll(calls: Call[]) {
    return this.provider.all(calls)
  }

  async load(key: string, call: any, config?: Config) {
    await when(() => wallet?.currentChainId && this.provider)
    key = `${wallet?.currentChainId}-${key}`
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    const res = this.addQueue(key, call, config)
    if (!this.lock) {
      this.processQueue()
    }
    this.lock = true
    return res
  }

  addQueue(key: string, call: any, config?: Config) {
    const res = new Promise((resolve, reject) => {
      this.tasks.push({
        key,
        call,
        resolve,
        reject,
        config
      })
    })
    this.cache.set(key, res)
    return res
  }
  processQueue () {
    setTimeout(async () => {
      const tasks = this.tasks
      this.tasks = []
      this.lock = false
      chunk(tasks, this.limit).forEach(async (chunkTasks) => {
        const data = await this.tryAll(chunkTasks.map((t) => t.call))
        chunkTasks.forEach((t, index) => {
          t.result = data[index]
          t.resolve(data[index])
          if (t.config?.cache) {
            if (t.config.cache.ttl) {
              setTimeout(() => {
                this.cache.delete(t.key)
              }, t.config.cache.ttl);
            }
          } else {
            this.cache.delete(t.key)
          }

        })
      })
    }, 500)

  }
}

