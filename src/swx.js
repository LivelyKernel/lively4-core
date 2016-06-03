/*
 *
 */

import * as fs from './filesystem.js'
import * as msg from './messaging.js'

import sysfs from './fs/sys.js'
import httpfs from './fs/http.js'
import html5fs from './fs/html5.js'
import githubfs from './fs/github.js'
import dropboxfs from './fs/dropbox.js'

import focalStorage from './external/focalStorage.js';


class ServiceWorker {
  constructor() {
    this.filesystem = new fs.Filesystem()

    // default file system
    this.filesystem.mount('/', githubfs, {repo: 'LivelyKernel/lively4-core', branch: 'gh-pages'})
    this.filesystem.mount('/sys', sysfs)
    this.filesystem.mount('/local', html5fs)

    this.filesystem.loadMounts();


    // here we should remount previous filesystem (remembered in focalStorage)
  }

  fetch(event) {
    let request = event.request;
    if (!request) return
    let  url   = new URL(request.url),
      promise = undefined

    if(url.hostname !== 'lively4') {
      if (url.pathname.match(/_git\/clone/)) {
        console.log("fetch: irgnore " + url)

        return // do nothing... ?
      }
      return fetch(request);
    } else {
      let response = this.filesystem.handle(request, url)

      response = response.then((result) => {
        if(result instanceof Response) {
          return result
        } else {
          return new Response(result)
        }
      }).catch((err) => {
        console.error('Error while processing fetch event:', err)

        let message = err.toString()
        let content = JSON.stringify({message: message})

        return new Response(content, {status: 500, statusText: message})
      })

      event.respondWith(response)
    }
  }

  message(event) {
    return msg.process(event)
  }
}

/*
 * function to object adapter
 */

var __instance__
export function instance() {
  if(typeof __instance__ === 'undefined') {
    __instance__ = new ServiceWorker()
  }

  return __instance__
}

export function install() {}
export function activate() {}

export function fetch(event) {
  return instance().fetch(event)
}

export function message(event) {
  return instance().message(event)
}


export {
  focalStorage
}
