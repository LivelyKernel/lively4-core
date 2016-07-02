//
// Client side boot loader
//
// This file initializes the ES6 System Loader,
// the ServiceWorker - if possible - and starts the initialize client code.
//
import * as path from 'path'

import { Loader } from './loader'

const { filter, shift } = Array.prototype

export default async function() {
  // Lookup self script tag as the service worker will be started using
  // the same kernel script.
  const script = do {
    document.querySelectorAll('script')
      ::filter(el => typeof el.dataset.livelyKernel !== 'undefined')
      ::shift()
  }

  if (typeof script === 'undefined') {
    throw new Error('Cannot find lively kernel script tag. You must add the `data-lively-kernel` attribute!')
  }

  let src = new URL(script.src)

  let base = do {
    if (%KERNEL_CONFIG_BASE%) {
      new URL(%KERNEL_CONFIG_BASE%, src)
    } else {
      new URL('../', src)
    }
  }

  //
  // Service worker
  //

  if (!('serviceWorker' in navigator)) {
    console.error('[KERNEL] ServiceWorker API not available')
    console.error('[KERNEL] Your browser is total wrong for this. I refuse to continue any further...')
    return undefined
  }

  try {
    let scope = new URL('./', src)
    let registration = await navigator.serviceWorker.register(src, {scope: scope})

    let serviceWorker = do {
      registration.installing || registration.waiting || registration.active
    }

    if (serviceWorker.state !== 'activated' && serviceWorker.state !== 'activated') {
      let swState = new Promise((resolve, reject) => {
        const fn = (event) => {
          serviceWorker.removeEventListener('statechange', fn)

          if (event.target.state === 'redundant') {
            reject(new Error('State changed to redundant'))
          } else {
            resolve(event.target)
          }
        }

        serviceWorker.addEventListener('statechange', fn)
      })

      await swState
    }

    // Set loader base to redirect all file requests to service worker
    // file systems
    // TODO: Should this be part of the kernel or user land?
    // base = new URL('https://lively')

    console.log('[KERNEL] ServiceWorker registered and ready')

  } catch(e) {
    console.error('[KERNEL] ServiceWorker install failed:', e)
    console.log('[KERNEL] Continue with client-only boot...')
  }

  //
  // ES module loader
  //

  let loader = new Loader({
    base: base
  })

  loader.set('kernel', {
    resolve: (name) => loader.resolve(name).toString(),
    realpath: (name) => path.resolve(name),
  })

  //
  // Initialize system (like running init process)
  //

  let init = do {
    if ('livelyKernelInit' in script.dataset) {
      script.dataset.livelyKernelInit
    } else {
      if (%KERNEL_CONFIG_CLIENT_INIT%) {
        path.resolve(%KERNEL_CONFIG_CLIENT_INIT%)
      } else {
        false
      }
    }
  }

  if (init) {
    return loader.import(init)
  } else {
    return true
  }
}
