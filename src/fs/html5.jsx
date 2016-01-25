/*
 * In-browser local file system access using HTML5 FileSystem-API.
 */

import { Base } from './base.jsx'

export default class Filesystem extends Base {
    constructor(path, options) {
        super('html5', path, options)
    }

    read(file) {
        return this._rpc({name: 'swx:readFile', file: file})
            .then((event) => event.data.content)
    }

    write(file, content) {
        return content.then((actualContent) => {
            return this._rpc({
                name: 'swx:writeFile',
                file: file,
                content: actualContent
            }).then((event) => event.data.content)
        }.bind(this))
    }

    _rpc(data) {
        return new Promise((resolve, reject) => {
            console.log('RPC request:', data)
            self.clients.matchAll().then((clients) => {
                let channel = new MessageChannel()
                let client  = clients[0]

                channel.port1.onmessage = resolve
                client.postMessage(data, [channel.port2])
            })
        }).then((event) => {
            console.log('RPC response:', event.data)
            return event
        }).then((event) => {
            if(event.data.error) {
                throw new Error(event.data.error)
            } else {
                return event
            }
        })
    }
}
