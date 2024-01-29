export abstract class Plugin {
  observerKeys: string[] = []
  target: Object
  get observerKeysMap() {
    return this.observerKeys.reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
  }
  static plugins = new Map()
  constructor({ observerKeys }: Partial<Plugin>) {
    this.observerKeys = observerKeys || []
  }
  static addPlugins(key, plugins: Plugin []) {
    Plugin.plugins.set(key, plugins)
  }
  static trigger(target: Object,key: string,  oldValue: any, newValue: any) {
    Plugin.plugins.get(target)?.forEach((plugin) => {
      if (plugin.observerKeysMap[key]) {
        plugin.onValueChange(key, oldValue, newValue)
      }
    })
  }
  abstract onValueChange(key: string, oldValue: any, newValue: any): void
}
