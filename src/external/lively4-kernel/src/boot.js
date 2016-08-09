// Do not use import here to allow conditional
// drop of imports due to compile flags below

// import client from './client'
// import worker from './worker'

(function() {
  if (KERNEL_CONFIG.CLIENT_ENABLED) {
    if(typeof window !== 'undefined') {
      // We're in the browser window/tab
      // Invoke boot loader
      return require('./client').default.call(window)
    }
  }

  if (KERNEL_CONFIG.WORKER_ENABLED) {
    if(typeof self !== 'undefined') {
      // We're in the service worker
      // Load service worker
      return require('./worker').default.call(self)
    }
  }
})()
