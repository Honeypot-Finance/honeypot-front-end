
import EventEmitter from 'eventemitter3'
import debounce from 'lodash/debounce'

export const ee = new EventEmitter()

export const whenEventMap = new Map()
export const reactionEventMap = new Map()

export const when = (func: Function, callback?:Function) => {

     return new Promise((resolve) => {
        if (!whenEventMap.has(func)) {
          whenEventMap.set(func, {
            func,
            resolve,
            callback
          })
        }
        const res = whenEventMap.get(func).func()
        if (res) {
           whenEventMap.delete(func)
           callback?.(res)
           return resolve(res)
        }
     })
}

export const triggerWhen = debounce(() => {
  Array.from(whenEventMap.entries()).forEach(([key, value]) => {
       try {
        const res = value.func()
        if (res) {
          value.callback?.(res)
          value.resolve(res)
          whenEventMap.delete(key)
       }
       } catch (error) {

       }

   })
}, 100)

export const reaction = (func: Function, callback: (data: any) => void) => {
  try {
   if (!reactionEventMap.has(func)) {
    reactionEventMap.set(func, {
      callback,
      data: undefined,
      func
     })
   }
  } catch (error) {

  }
}


export const triggerReaction = debounce(() => {
  Array.from(reactionEventMap.entries()).forEach(([key, value]) => {
        const data = value.func()
        if (data !== value.data) {
          value.callback(data)
          value.data = data
        }
    })
}, 100)
