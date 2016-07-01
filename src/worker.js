import * as path from 'path'

import { Loader } from './loader'

var loader

const system = () => {
  if (typeof loader === 'undefined') {
    let scope = new URL(self.registration.scope)
    let base = new URL(path.join(scope.pathname, path.resolve(kernel_conf.base)), scope)

    loader = new Loader({
      base: base
    })

    if (KERNEL_CONFIG_WORKER_EMBED) {
      loader.set(KERNEL_CONFIG_WORKER_INIT, require(KERNEL_CONFIG_WORKER_INIT))
    }
  }

  return loader
}

const init = async (fn) => {
  return system().import(path.resolve(kernel_conf.initsw)).then(fn)
}

export default function() {
  this.addEventListener('install', (event) => {
    event.waitUntil(init(worker => worker.install(event)))
  })

  this.addEventListener('activate', (event) => {
    event.waitUntil(init(worker => worker.activate(event)))
  })

  this.addEventListener('fetch', (event) => {
    event.waitUntil(init(worker => worker.fetch(event)))
  })

  this.addEventListener('message', (event) => {
    if(event.data === 'kernel:sw-force-reload') {
      loader = undefined
    }

    event.waitUntil(init(worker => worker.message(event)))
  })
}
