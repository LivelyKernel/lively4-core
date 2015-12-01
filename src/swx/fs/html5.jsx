/*
 * In-browser local file system access using HTML5 FileSystem-API.
 */

import { Base } from './base.jsx'

export class Filesystem extends Base {
    constructor(path, options) {
        super(path, options)

        this.quota = options.quota || 1024*1024*10;

        // this.grantedQuota = this._rpc({name: 'swx:requestQuota'}).then((event) => event.data.grantedQuota)
        // this.fs = new Promise((resolve, reject) => {
        //     self.clients.matchAll().then((clients) => {
        //         let channel = new MessageChannel()
        //         let client  = clients[0]

        //         channel.port1.onmessage = function(event) {
        //             console.log('Got quota request response', event.data)

        //             let grantedQuota = event.data.grantedQuota

        //             self.webkitRequestFileSystem(PERSISTENT, grantedQuota, resolve, reject)
        //             // debugger
        //         }

        //         client.postMessage({name: 'swx:requestQuota'}, [channel.port2])
        //         // debugger
        //     })

        //     // debugger
        //     // self.webkitRequestFileSystem(TEMPORARY, this.quota, resolve, reject)
        // })
    }

    stat(path) {

    }

    read(file) {
        // return this.grantedQuota.then((grantedQuota) => {
            return this._rpc({name: 'swx:readFile', file: file})
                .then((event) => event.data.content)
        // })
    }

    write(file, content) {
        // return this.grantedQuota.then((grantedQuota) => {
            return content.then((actualContent) => {
                return this._rpc({
                    name: 'swx:writeFile',
                    file: file,
                    content: actualContent
                }).then((event) => event.data.content)
            }.bind(this))
        // })
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
