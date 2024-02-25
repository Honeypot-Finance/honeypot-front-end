import Vue from 'vue'
import { triggerReaction, triggerWhen } from '../event'
import { Plugin } from './plugin'


function observeEvent(obj) {
  const objProperties = {}
  const keys = Object.keys(obj)
  keys.forEach((key) => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(obj, key)
    const originalSetter =
      originalDescriptor && originalDescriptor.set
        ? originalDescriptor.set
        : (value) => value

    objProperties[key] = {
      set(newVal) {
        if (newVal !== obj[key]) {
          Plugin.trigger(obj,key, obj[key], newVal)
          triggerWhen()
          triggerReaction()
        }
        originalSetter(newVal)
      },
    }
  })
  Object.defineProperties(obj, objProperties)
}
export const makeAutoObservable = (args, plugins?: Plugin[]) => {
  const observer = Vue.observable(args)
  observeEvent(args)
  if (plugins?.length) {
    Plugin.addPlugins(args, plugins)
  }
  return observer
}
