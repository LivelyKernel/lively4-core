// Do not use import here to allow conditional
// drop of imports due to compile flags below

import client from './client.js'
import worker from './worker.js'

(function() {
  if (%KERNEL_CONFIG_CLIENT%) {
    if(typeof window !== 'undefined') {
      // We're in the browser window/tab
      // Invoke boot loader
      return client.call(window)
    }
  }

  if (%KERNEL_CONFIG_WORKER%) {
    if(typeof self !== 'undefined') {
      // We're in the service worker
      // Load service worker
      return worker.call(self)
    }
  }
})()
