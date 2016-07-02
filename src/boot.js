// Do not use import here to allow conditional
// drop of imports due to compile flags below

// import client from './client'
// import worker from './worker'

if(typeof window !== 'undefined') {
  // We're in the browser window/tab
  // Invoke boot loader

    require('./client').call(window)
  if (%KERNEL_CONFIG_CLIENT%)

} else if(typeof self !== 'undefined') {
  // We're in the service worker
  // Load service worker

    require('./worker').call(self)
  if (%KERNEL_CONFIG_WORKER%)
}
