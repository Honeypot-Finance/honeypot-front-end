import { Plugin } from './plugin'

class Store {
  store?: any
  constructor(store?: any) {
    this.store = store || window.localStorage
  }
  getItem(key: string) {
    try {
      const value = this.store.getItem(key)
      if (!value) {
        return value
      }
      return JSON.parse(value)
    } catch (error) {
      console.error(error)
    }
  }
  setItem(key: string, value: any) {
    try {
      const originValue = this.getItem(key)
      return this.store.setItem(key, JSON.stringify(Object.assign(originValue || {}, value)))
    } catch (error) {
      console.error(error)
    }
  }
}


export class StorePlugin extends Plugin {
  namespace: string
  store: Store
  target: Object
  constructor({ store, namespace, target, observerKeys }: Partial<StorePlugin>) {
    super({observerKeys})
    this.target = target
    this.store = store || new Store()
    this.namespace = namespace || target?.constructor?.name
    const originValue = this.store.getItem(this.namespace)
    if (originValue) {
      Object.assign(target, originValue)
    }

  }
  onValueChange(key: string, oldValue: any, newValue: any) {
    this.store.setItem(this.namespace, {
      [key]: newValue
   })
  }
}
