//
// Client side boot loader
//
// This file initializes the ES6 System Loader,
// the ServiceWorker - if possible - and starts the initialize client code.
//
import { Loader } from './loader'

const { filter, shift } = Array.prototype

export default function() {

  // Lookup self script tag as the service worker will be started using
  // the same kernel script.
  const script = do {
    document.querySelectorAll('script')
      ::filter(el => typeof el.dataset.livelyKernelBoot !== 'undefined')
      ::shift()
  }

  if (typeof script === 'undefined') {
    throw new Error('Cannot find lively kernel script tag. You must add the `data-lively-kernel-boot` attribute!')
  }

  let init = do {
    if ('livelyKernelInit' in script.dataset) {
      script.dataset.livelyKernelInit
    } else {
      null
    }
  }

  const src = new URL(script.src)

  // Initialize service loader
  this.System = new Loader()
}


async function __boot__({src, scope}) {
  if (!('serviceWorker' in navigator)) {
    throw new RuntimeError('Serviceworker not supported.')
  }

  if (navigator.serviceWorker.controller) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug("[L4K] SW already installed")
    }
  } else {
    await navigator.serviceWorker.register(src, {scope: scope})
  }

  await navigator.serviceWorker.ready

  return true
}
