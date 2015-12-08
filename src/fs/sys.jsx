/*
 * Sysfs for the important things.
 */

import { Base } from './base.jsx'

export class Filesystem extends Base {
    constructor(path, options) {
        let {system, ...rest} = options
        super('sysfs', path, rest)

        this.tree = new SysDir(null, [
            new SysFile('mounts', function() {
                let json = []

                for(let [path, mount] of system.mounts) {
                    json.push({
                        path: path,
                        name: mount.name,
                        options: mount.options
                    })
                }

                return json
            })
        ])
    }

    resolve(path) {
        return this.tree.resolve(path.substring(1))
    }

    stat(path) {
        return this.resolve().then((node) => node.stat())

        // return this._resolve(path).then((object) => {
        //     if(typeof object === 'function') {
        //         let json = {
        //             type: 'file',
        //             name: ''
        //         }

        //         return JSON.stringify(json, null, '\t')
        //     } else {
        //         let json = {
        //             type: 'directory',
        //             contents:
        //         }

        //         return JSON.stringify(json, null, '\t')
        //     }
        // }).catch(() => {
        //     return new Response(null, {status: 404})
        // })
    }

    read(path) {
        return this.resolve().then((node) => node.read())

        // return this._resolve(path).then((object) => {
        //     if(typeof object === 'function') {
        //         return object()
        //     } else {
        //         let headers = new Headers()
        //         headers.append('Allow', 'OPTIONS')
        //         return new Response(null, {status: 405, statusMessage: 'EISDIR', headers: headers})
        //     }
        // }).catch(() => {
        //     return new Response(null, {status: 404})
        // })
    }
}

class Inode {
    constructor(name) {
        this.name = name
    }

    read() {
        return this._notImplemented()
    }

    write() {
        return this._notImplemented()
    }

    stat() {
        throw Error("Not implemented but required")
    }

    access() {
        return {read: false, write: false}
    }

    _notImplemented() {
        let headers = new Headers()
        headers.append('Allow', 'OPTIONS')

        if(this.access().read)
            headers.append('Allow', 'GET')
        if(this.access().write)
            headers.append('Allow', 'PUT')

        let response = new Response(null, {
            status: 405,
            headers: headers
        })

        return Promise.resolve(response)
    }
}

class Directory extends Inode {
    stat({contents = true} = {}) {
        let json = {
            type: 'directory',
            name: this.name
        }

        if(contents) {
            let children = this.children()

            json['contents'] = []

            for(let child in children) {
                let cstat = child.stat({
                    contents: false
                })

                json['contents'].push(stat)
            }
        }

        let headers = new Headers()
        headers.append('Allow', 'OPTIONS')

        let content = JSON.stringify(json, null, '\t'),
            response = new Response(content, {headers: headers})

        return Promise.resolve(response)
    }
}

class File extends Inode {
    statinfo() {
        return {}
    }

    stat() {
        let info = this.statinfo()
        let json = Object.assign({}, info, {
                type: 'file',
                name: this.name
            })

        let headers = new Headers()
        let content = JSON.stringify(json, null, '\t')

        headers.append('Allow', 'OPTIONS')

        if(this.access().read)
            headers.append('Allow', 'GET')
        if(this.access().write)
            headers.append('Allow', 'PUT')

        let response = new Response(content, {headers: headers})

        return Promise.resolve(response)
    }
}

class SysDir extends Directory {
    constructor(name, children) {
        super(name)
        this.children = children
    }

    children() {
        return this.children
    }

    resolve(path) {
        let [name, rest] = path.split(/\/+/, 2)
        let node = children.find((child) => child.name === name)

        if(rest) {
            if(node instanceof SysDir) {
                return node.resolve(rest)
            } else {
                return Promise.reject(new Error('ENOTDIR'))
            }
        } else {
            return Promise.reolve(tree)
        }
    }
}

class SysFile extends File {
    constructor(name, rfn, wfn) {
        super(name)

        this.rfn = rfn
        this.wfn = wfn
    }

    access() {
        return {
            read: typeof this.rfn === 'function',
            write: typeof this.wfn === 'function'
        }
    }

    read() {
        if(typeof this.rfn === 'function') {
            let json     = this.rfn()
            let content  = JSON.stringify(json, null, '\t')
            let response = new Response(content)

            return Promise.resolve(response)
        } else {
            return super.read()
        }
    }

    write(content) {
        if(typeof this.wfn === 'function') {
            let json     = this.wfn()
            let content  = JSON.stringify(json, null, '\t')
            let response = new Response(content)

            return Promise.resolve(response)
        } else {
            return super.write(content)
        }
    }
}

