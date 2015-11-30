/*
 *
 */

import * as Path from 'src/swx/path.jsx'
import * as Http from 'src/swx/fs/http.jsx'
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
    }

    mount(path, type, options = {}) {
        path = Path.normalize(path)

        this.mounts.set(path, new type(path, options))
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

        if(request.method === 'GET')
            return fs.read(path, request)
        if(request.method === 'PUT')
            return fs.write(path, request.text(), request)
        if(request.method === 'OPTIONS')
            return fs.stat(path, request)

        // TODO: respond with 400 / 404?
    }
}
