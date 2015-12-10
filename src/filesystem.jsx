/*
 *
 */

import * as Sys from 'src/swx/fs/sys.jsx'
import * as Path from 'src/swx/path.jsx'
import * as Http from 'src/swx/fs/http.jsx'
import * as Html5 from 'src/swx/fs/html5.jsx'
import * as Github from 'src/swx/fs/github.jsx'

/**
 * Global file system subsystem.
 *
 * Holds an manages mount points. Resolves paths to mountpoints and queries
 * mounted file systems.
 */
export class Filesystem {
    constructor() {
        this.mounts = new Map()
        this.mount('/', Github.Filesystem, {repo: 'LivelyKernel/lively4-core'})
        this.mount('/sys', Sys.Filesystem, {}, this)
        this.mount('/local', Html5.Filesystem)

        this.reqcount = 0
    }

    mount(path, type, ...args) {
        path = Path.normalize(path)

        this.mounts.set(path, new type(path, ...args))
    }

    handle(request, url) {
        let path = url.pathname,
            base = undefined,
            fs   = undefined

        for(let [mount, fsys] of this.mounts) {
            if(path.startsWith(mount) && (typeof base === 'undefined' || mount.length > base.length)) {
                fs   = fsys
                base = mount
            }
        }

        path = path.substring(base.length)

        this.reqcount++

        if(request.method === 'GET')
            return fs.read(path, request)
        if(request.method === 'PUT')
            return fs.write(path, request.text(), request)
        if(request.method === 'OPTIONS')
            return fs.stat(path, request)

        return new Response(null, {status: 400})
        // TODO: respond with 400 / 404?
    }
}

export class File {
    constructor(name, stat) {
        this.name = name
    }

    read() {

    }
}

export class Directory {
    constructor(name, children, options) {
        this.name     = name
        this.children = children
        this.options  = options
    }

    asJson(options = {}) {
        let json = {
            'type': 'directory'
        }

        if(!('recursive' in options) || options.recursive)
            json['contents'] = this.children.map((child) => child.asJson({recursive: false}))

        return json
    }
}
