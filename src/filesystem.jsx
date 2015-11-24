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

    handle(request) {
        let path = request.pathname,
            base = undefined,
            fs   = undefined

        for(let [mount, fsys] of this.mounts) {
            if(path.startsWith(mount) && mount.length > fs.path.length) {
                fs   = fsys
                base = mount
            }
        }

        path = path.substring(fs.path.length)

        if(request.method === 'GET')
            return mount.fs.read(path)
        if(request.method === 'PUT')
            return mount.fs.write(path, request.text())
        if(request.method === 'OPTIONS')
            return mount.fs.stat(path)

        // TODO: respond with 400 / 404?
    }
}
