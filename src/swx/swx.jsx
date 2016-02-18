/*
 *
 */

import * as fs from 'src/swx/filesystem.jsx'
import * as msg from 'src/swx/messaging.jsx'

import sysfs from 'src/swx/fs/sys.jsx'
import httpfs from 'src/swx/fs/http.jsx'
import html5fs from 'src/swx/fs/html5.jsx'
import githubfs from 'src/swx/fs/github.jsx'
import dropboxfs from 'src/swx/fs/dropbox.jsx'

import focalStorage from 'src/external/focalStorage.js';


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
        let request = event.request,
            url     = new URL(request.url),
            promise = undefined

        if(url.hostname !== 'lively4')
            return self.fetch(event.request)

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
