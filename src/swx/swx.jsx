/*
 *
 */

import * as fs from 'src/swx/filesystem.jsx'
import * as msg from 'src/swx/messaging.jsx'

class ServiceWorker {
    constructor() {
        this.filesystem = new fs.Filesystem()
    }

    fetch(event) {
        let request = event.request,
            url     = new URL(request.url),
            promise = undefined

        console.log('Handle fetch', event)

        if(url.hostname !== 'lively4')
            return self.fetch(event.request)

        event.respondWith(this.filesystem
            .handle(request, url)
            .then((result) => {
                if(result instanceof Response) {
                    return result
                } else {
                    return new Response(result)
                }
            }).catch((err) => {
                console.error('Error while processing fetch event:', err)
                return new Response('', {status: 500})
            }))
    }

    message(event) {
        return msg.process(event)
    }
}

/*
 * function to object adapter
 */

var __instance__
function instance() {
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
