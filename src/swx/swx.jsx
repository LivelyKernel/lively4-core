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
        let request = event.request;
        let url     = new URL(request.url);

        if(url.hostname === 'lively4') { // Pseudo root node
            this.filesystem.handle(url.pathname)
        } else {
            return self.fetch(event.request)
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
