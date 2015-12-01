/*
 * In-browser local file system access using HTML5 FileSystem-API.
 */

import { Base } from './base.jsx'

export class Filesystem extends Base {
    constructor(path, options) {
        super(path, options)

        this.quota = options.quota || 1024*1024*10;

        this.fs = new Promise((resolve, reject) => {
            self.clients.matchAll().then((clients) => {
                let channel = new MessageChannel()
                let client  = clients[0]

                channel.port1.onmessage = function(event) {
                    console.log('Got quota request response', event.data)

                    let grantedQuota = event.data.grantedQuota

                    self.webkitRequestFileSystem(PERSISTENT, grantedQuota, resolve, reject)
                    // debugger
                }

                client.postMessage({name: 'swx:requestQuota'}, [channel.port2])
                // debugger
            })

            // debugger
            // self.webkitRequestFileSystem(TEMPORARY, this.quota, resolve, reject)
        })
    }

    stat(path) {

    }

    read(file) {
        return this.fs.then((fs) => {
            return new Promise((resolve, reject) => {
                fs.root.getFile(file, function(file) {
                    let reader = new FileReader()

                    reader.onloadend = function(e) {
                        console.log('Read complete', e)
                        resolve(this.result)
                    }

                    reader.readAsText(file)
                }, reject)
            })
        })
    }

    write(file, content) {
        return this.fs.then((fs) => {
            return new Promise((resolve, reject) => {
                fs.root.getFile(file, {create: true, exclusive: false}, function(file) {
                    file.createWriter(function (writer) {

                        writer.onwriteend = function(e) {
                            console.log("Write complete", e)
                            resolve()
                        }

                        writer.onerror = reject

                        let bb = new BlobBuilder()
                        bb.append(content)

                        writer.write(bb.getBlob('text/plain'))
                    }, reject)
                }, reject)
            })
        })
    }
}
