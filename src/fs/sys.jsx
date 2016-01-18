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
                    self.__reload__({force: true})
                    return ""
                })
            ]),
            new SysDir('fs', [
                new SysFile('mount', null, ::this._sysFsMount)
            ])
        ])
    }

    _sysFsMount(content) {
        console.log(content)
    }

    resolve(path) {
        return this.tree.resolve(path.substring(1))
    }

    async stat(path) {
        let node = await this.resolve(path)
        return node.stat()
    }

    async read(path) {
        let node = await this.resolve(path)
        return node.read()
    }

    async write(path, content) {
        let node = await this.resolve(path)
        return node.write(content)
    }
}

class Inode {
    constructor(name) {
        this.name = name
    }

    async read() {
        return this._notImplemented()
    }

    async write() {
        return this._notImplemented()
    }

    async statinfo() {
        throw Error("Not implemented but required")
    }

    async stat(...args) {
        let info = await this.statinfo()

        let headers = new Headers()
        headers.append('Allow', 'OPTIONS')

        if(this.access().read)
            headers.append('Allow', 'GET')
        if(this.access().write)
            headers.append('Allow', 'PUT')

        let body = JSON.stringify(info, null, '\t')
        return new Response(body)
    }

    async access() {
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

        return response
    }
}

class Directory extends Inode {
    async statinfo({contents = true} = {}) {
        let info = {
            type: 'directory',
            name: this.name
        }

        if(contents) {
            let children = await this.children()
            let contents = await* [
                for(child of children) child.statinfo({contents: false})
            ]

            Object.assign(info, {contents: contents})
        }

        return info
    }
}

class File extends Inode {
    async statinfo() {
        return {
            type: 'file',
            name: this.name
        }
    }
}

class SysDir extends Directory {
    constructor(name, children) {
        super(name)
        this._children = children
    }

    async children() {
        if(typeof this._children === 'function') {
            return this._children()
        } else {
            return this._children
        }
    }

    async resolve(path) {
        if(path.length == 0)
            return this

        let [name, ...rest] = do {
            typeof path === 'string' ? path.split(/\/+/) : path
        }

        if(name === '')
            return this

        let children = await this.children()
        let node     = children.find((child) => child.name === name)

        if(rest.length > 0) {
            if(node instanceof SysDir) {
                return node.resolve(rest)
            } else {
                throw new Error('ENOTDIR')
            }
        } else if(node) {
            return node
        } else {
            throw new Error('ENOTFOUND')
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

    async read() {
        if(typeof this.rfn === 'function') {
            let json     = await this.rfn()
            let content  = JSON.stringify(json, null, '\t')
            let response = new Response(content)

            return response
        } else {
            return super.read()
        }
    }

    async write(blob) {
        if(typeof this.wfn === 'function') {
            let json     = await this.wfn(blob)
            let content  = JSON.stringify(json, null, '\t')
            let response = new Response(content)

            return response
        } else {
            return super.write(blob)
        }
    }
}

