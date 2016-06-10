import * as path from 'path'
import kernel_conf from 'kernel_conf'

import { Loader } from './loader'

var loader

const system = () => {
  if (typeof loader === 'undefined') {
    loader = new Loader({
      base: new URL(kernel_conf.base, new URL(self.registration.scope))
    })
  }

  return loader
}

const init = (fn) => {
  system().import(kernel_conf.initsw).then(fn)
}

export default function() {
  this.addEventListener('install', (event) => {
    // event.waitUntil(this.skipWaiting())

    event.waitUntil(init(worker => worker.install(event)))
  })

  this.addEventListener('activate', (event) => {
    // event.waitUntil(this.clients.claim())

    event.waitUntil(init(worker => worker.activate(event)))
  })

  this.addEventListener('fetch', (event) => {
    event.waitUntil(init(worker => worker.fetch(event)))
  })

  this.addEventListener('message', (event) => {
    event.waitUntil(init(worker => worker.message(event)))
  })
}
