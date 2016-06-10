//
// Client side boot loader
//
// This file initializes the ES6 System Loader,
// the ServiceWorker - if possible - and starts the initialize client code.
//
import * as path from 'path'
import kernel_conf from 'kernel_conf'

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

  //
  // Service worker
  //

  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register(src, {scope: './'})
    await navigator.serviceWorker.ready

    // Set loader base to redirect all file requests to service worker
    // file systems
    src = new URL('https://lively/')

  } else {
    console.error('[KERNEL] ServiceWorker API not available')
  }

  //
  // ES module loader
  //

  let loader = new Loader({
    base: src
  })

  loader.set('kernel', {
    resolve: (name) => loader.resolve(name).toString(),
    realpath: (name) => path.normalize(name),
  })

  //
  // Initialize system (like running init process)
  //

  let init = do {
    if ('livelyKernelInit' in script.dataset) {
      script.dataset.livelyKernelInit
    } else {
      path.normalize(kernel_conf.init)
    }
  }

  if (init) {
    return loader.import(init)
  } else {
    return true
  }
}
