/*
 * Sysfs for the important things.
 */

import { Base } from './base.jsx'
import * as swx from '../swx.jsx'

export default class Filesystem extends Base {
    constructor(path, options) {
        super('sysfs', path, options)

        let name = path.split(/\/+/)
        name = name[name.length - 1]

        this.tree = new SysDir(name, [
            new SysFile('mounts', function() {
                let json = []

                for(let [path, mount] of swx.instance().filesystem.mounts) {
                    json.push({
                        path: path,
                        name: mount.name,
                        options: mount.options
                    })
                }

                return json
            }),
            new SysDir('swx', [
                new SysFile('reqcount', function() {
                    return swx.instance().filesystem.reqcount
                }),
                new SysFile('reload', null, function() {
                    self.__swx_refresh__({force: true})
                    return ""
                })
            ])
        ])
    }

    resolve(path) {
        return this.tree.resolve(path.substring(1))
    }

    stat(path) {
        return this.resolve(path).then((node) => node.stat())
    }

    read(path) {
        return this.resolve(path).then((node) => node.read())
    }

    write(path, content) {
        return this.resolve(path).then((node) => node.write(content))
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

    statinfo() {
        throw Error("Not implemented but required")
    }

    stat(...args) {
        return this.statinfo(...args).then((info) => {
            let headers = new Headers()
            headers.append('Allow', 'OPTIONS')

            if(this.access().read)
                headers.append('Allow', 'GET')
            if(this.access().write)
                headers.append('Allow', 'PUT')

            let body = JSON.stringify(info, null, '\t')
            return new Response(body)
        })
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
    statinfo({contents = true} = {}) {
        let cts = Promise.resolve(null)

        if(contents) {
            cts = this.children().then((children) => {
                return Promise.all(children.map((child) => {
                    return child.statinfo({contents: false})
                }))
            })
        }

        return cts.then((content) => {
            let cjson

            if(content)
                cjson = {contents: content}

            return Object.assign({}, cjson, {
                type: 'directory',
                name: this.name
            })
        })
    }
}

class File extends Inode {
    statinfo() {
        return Promise.resolve({
            type: 'file',
            name: this.name
        })
    }
}

class SysDir extends Directory {
    constructor(name, children) {
        super(name)
        this._children = children
    }

    children() {
        return Promise.resolve(this._children)
    }

    resolve(path) {
        if(path.length == 0)
            return Promise.resolve(this);

        let [name, rest] = path.split(/\/+/, 2)
        let node = this._children.find((child) => child.name === name)

        if(rest) {
            if(node instanceof SysDir) {
                return node.resolve(rest)
            } else {
                return Promise.reject(new Error('ENOTDIR'))
            }
        } else if(node) {
            return Promise.resolve(node)
        } else {
            return Promise.reject(new Error('ENOTFOUND'))
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

