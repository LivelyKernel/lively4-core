
import client from './client'
import worker from './worker'

if(typeof window !== 'undefined') {
  // We're in the browser window/tab
  // Invoke boot loader

  client.call(window)

} else if(typeof self !== 'undefined') {
  // We're in the service worker
  // Load service worker

  worker.call(self)
}
