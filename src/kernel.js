
import boot from './boot'
import worker from './worker'

if(typeof window !== 'undefined') {
  // We're in the browser window/tab
  // Invoke boot loader

  boot.call(window)

} else if(typeof self !== 'undefined') {
  // We're in the service worker
  // Load service worker

  worker.call(self)
}
