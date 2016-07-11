
import { Loader } from './loader'

const system = () => {
  if (!self.System) {
    let scope = new URL(self.registration.scope)
    let base = scope

    if (KERNEL_CONFIG.WORKER_BASE) {
      base = new URL(KERNEL_CONFIG.WORKER_BASE, base)
    }

    self.System = new Loader({
      base: base
    })

    console.warn('[SW] Kick-off from ' + base.toString())

    if (KERNEL_CONFIG.WORKER_EMBED) {
      System.set(KERNEL_CONFIG.WORKER_INIT, require(KERNEL_CONFIG.WORKER_INIT))
    }
  }

  return System
}

const init = async () => {
  return system().import(KERNEL_CONFIG.WORKER_INIT)
}

export default function() {
  this.addEventListener('install', (event) => {
    event.waitUntil(
      init()
        .then(worker => worker.install(event))
        .catch(error => { console.error(error); throw error })
    )
  })

  this.addEventListener('activate', (event) => {
    event.waitUntil(
      init()
        .then(worker => worker.activate(event))
        .catch(error => { console.error(error); throw error })
    )
  })

  this.addEventListener('fetch', (event) => {
    event.waitUntil(
      init()
        .then(worker => worker.fetch(event))
        .catch(error => { console.error(error); throw error })
    )
  })

  this.addEventListener('message', (event) => {
    if(event.data === 'kernel:sw-force-reload') {
      loader = undefined
    }

    event.waitUntil(
      init()
        .then(worker => worker.message(event))
        .catch(error => { console.error(error); throw error })
    )
  })
}
