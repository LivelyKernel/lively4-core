import { uuid } from 'utils';

export default class Sandbox {
  
  constructor() {
    return (async () => {
      const frame = this.iframe = document.createElement('iframe')

      const w = lively.openInWindowSync(frame)
      lively.focusWithoutScroll(w)

      frame.src = lively4url + '/start.html'
      frame.setAttribute('is-sandboxed', true)

      await new Promise((resolve, reject) => {
        frame.onload = onloadEvt => {
          // lively.warn('onload', 'sandbox')
          frame.contentDocument.addEventListener("livelyloaded", livelyloadedEvt => {
            resolve()
            // lively.warn('livelyloaded', 'sandbox')

            // console.warn('livelyloaded', frame.contentWindow.foo)
          })
          // console.warn('ONLOAD', frame.contentWindow.foo)
        }
      })
      
      return new Proxy(this, {
        get(target, prop, receiver) {
          if (Reflect.has(target, prop)) {
            return Reflect.get(target, prop, receiver);
          }

          return Reflect.get(target.contentWindow, prop, receiver)
        }
      });
    })()
  }
  
  get contentWindow() {
    return this.iframe.contentWindow
  }
  
}

// await new Sandbox()

// console.warn('before src')
// console.warn('after src')

// console.warn('before attachment')
// console.warn('before attachment', iframe.contentWindow.foo)
// console.warn('after attachment')
// window.parent === window
// that.frame.contentWindow.parent === window

