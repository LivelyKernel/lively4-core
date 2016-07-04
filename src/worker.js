import * as path from 'path'

import { Loader } from './loader'

var loader

const system = () => {
  if (typeof loader === 'undefined') {
    let scope = new URL(self.registration.scope)
    let base = scope

    if (KERNEL_CONFIG.WORKER_BASE) {
      base = new URL(KERNEL_CONFIG.WORKER_BASE, base)
    }

    loader = new Loader({
      base: base
    })

    console.warn('[SW] Kick-off from ' + base.toString())

    if (KERNEL_CONFIG.WORKER_EMBED) {
      loader.set(KERNEL_CONFIG.WORKER_INIT, require(KERNEL_CONFIG.WORKER_INIT))
    }
  }

  return loader
}

const init = async (fn) => {
  return system().import(path.resolve(KERNEL_CONFIG.WORKER_INIT)).then(fn)
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
