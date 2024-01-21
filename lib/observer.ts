import Vue from 'vue'
import { triggerReaction, triggerWhen } from './event'


function observeEvent(obj) {
   const objProperties = {};
   const keys = Object.keys(obj);
  keys.forEach(key => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(obj, key);
    const originalSetter = originalDescriptor && originalDescriptor.set ? originalDescriptor.set : value => value;

      objProperties[key] = {
          set(newVal) {
              if (newVal !== obj[key]) {
                  triggerWhen();
                  triggerReaction();
              }
              originalSetter(newVal);
          }
      };
  });

  Object.defineProperties(obj, objProperties);
}


// function createEventProxy(target) {
//   const handler = {
//     set(target, property, value, receiver) {
//       if (process.env.NODE_ENV !== 'production') {
//         console.log(
//           `Changed property ${property} from`,
//           target[property],
//           `to`,
//           value
//         )
//       }
//       if (value !== target[property]) {
//         ee.emit(`${target.constructor.name}.${property}`, value)
//       }
//       return Reflect.set(target, property, value, receiver)
//     },
//   }

//   return new Proxy(target, handler)
// }
export const makeAutoObservable = (args) => {
  Vue.observable(args)
  observeEvent(args)
}
