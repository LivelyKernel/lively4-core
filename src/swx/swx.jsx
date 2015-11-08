/*
 *
 */

import * as fs from 'src/swx/filesystem.jsx'
import * as msg from 'src/swx/messaging.jsx'

export function install(event) {}
export function activate(event) {}

export function fetch(event) {
    let request = event.request;
    let url     = new URL(request.url);

    if(url.hostname === 'lively4') { // Pseudo root node
        if(request.method === 'GET') {
            return fs.read(url.pathname)
        }
    } else {
        return self.fetch(event.request)
    }
}

export function message(event) {
    return msg.process(event)
}
