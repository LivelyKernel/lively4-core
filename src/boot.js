// Do not use import here to allow conditional
// drop of imports due to compile flags below

import client from './client.js'
import worker from './worker.js'

if(typeof window !== 'undefined') {
  // We're in the browser window/tab
  // Invoke boot loader

  if (KERNEL_CONFIG_CLIENT)
    client.call(window)

} else if(typeof self !== 'undefined') {
  // We're in the service worker
  // Load service worker

  if (KERNEL_CONFIG_WORKER)
    worker.call(self)
}
