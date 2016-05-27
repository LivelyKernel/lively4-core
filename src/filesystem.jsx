
import * as Path from './path.jsx'
import focalStorage from './external/focalStorage.js'


/**
 * Global file system subsystem.
 *
 * Holds an manages mount points. Resolves paths to mountpoints and queries
 * mounted file systems.
 */
export class Filesystem {
    constructor() {
        this.mounts = new Map()
        this.reqcount = 0
    }

    mount(path, type, ...args) {
        path = Path.normalize(path)
        this.mounts.set(path, new type(path, ...args))
    }

    umount(path) {
        path = Path.normalize(path)
        this.mounts.delete(path)
    }

    handle(request, url) {
        let path = Path.normalize(url.pathname),
            base = undefined,
            fs   = undefined

        for(let [mount, fsys] of this.mounts) {
            if(path.startsWith(mount) && (typeof base === 'undefined' || mount.length > base.length)) {
                fs   = fsys
                base = mount
            }
        }

        if(typeof base === 'undefined') {
          return new Response(null, {status: 400})
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

    mountsAsJso() {
      let jso = []
      for(let [path, mount] of this.mounts) {
          jso.push({
              path: path,
              name: mount.name,
              options: mount.options
          })
      }
      return jso
    }

    persistMounts() {
      var mounts = this.mountsAsJso()
      console.log("persist mounts: " + mounts)
      focalStorage.setItem("lively4mounts", mounts)
    }

    // #TODO refactor to "async/await style"
    loadMounts(){
      focalStorage.getItem("lively4mounts").then((mounts) => {
        try {
          mounts.forEach(mount => {
            console.log("mount ", mount)
            System.import('src/swx/fs/' + mount.name + '.jsx').then(fs => {
              this.mount(mount.path, fs.default, mount.options)
            })
          })
        } catch(e) {
          console.log("error loading mounts: " + e)
        }
      })
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
