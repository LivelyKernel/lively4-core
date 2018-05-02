
import * as Path from './path.js'
import focalStorage from './external/focalStorage.js'
import * as basefs from './fs/base.js'


/**
 * Global file system subsystem.
 *
 * Holds an manages mount points. Resolves paths to mountpoints and queries
 * mounted file systems.
 */
export class Filesystem {
  constructor() {
    this.mounts = new Map();
    this.reqcount = 0;
  }

  mount(path, type, ...args) {
    path = Path.normalize(path)
    this.mounts.set(path, new type(path, ...args));
  }

  umount(path) {
    path = Path.normalize(path);
    this.mounts.delete(path);
  }

  async handle(request, url) {
    let path = Path.normalize(url.pathname),
      base = undefined,
      fs   = undefined

    
    for (let [mount, fsys] of this.mounts) {
      if (path.startsWith(mount) && (typeof base === 'undefined' || mount.length > base.length)) {
        fs   = fsys;
        base = mount;
      }
    }

    // console.log("base: " + base )
    
    if (typeof base === 'undefined') {
      return new Response(null, {status: 400});
    }

    path = path.substring(base.length);

    this.reqcount++;

    switch (request.method) {
      case 'GET':
        try {
          let read_resp = await fs.read(path, request);
          if (read_resp instanceof basefs.File) {
            return read_resp.toResponse();
          }
          return read_resp;
        }
        catch (e) {
          if (e.name === 'IsDirectoryError') {
            return new Response(null, {
              status: 405,
              statusText: 'EISDIR',
              headers: {'Allow': 'OPTIONS'}
            })
          } 
          console.log('Error: ' + e)
          // TODO: Do something with the information from the FileNotFoundError
          return new Response("ERROR:" + e, {status: 405});
        }
        break;
      case 'PUT':
        return fs.write(path, request.text(), request);
      case'DELETE': 
        return fs.del(path, request);
      case 'MKCOL':
        return fs.makeDir(path, request);
      case 'OPTIONS':
        try {
          // console.log("options path: " + path)
          let stat_resp = await fs.stat(path, request)
          if (stat_resp instanceof basefs.Stat) {
            return stat_resp.toResponse();
          }

          return stat_resp
        }
        catch (e) {
          // TODO: Do something with the information from the StatNotFoundError
          return new Response(null, {status: 405})
        }
      default:
        return new Response(null, {status: 400});
        // TODO: respond with 400 / 404?
    }
  }

  mountsAsJso() {
    let jso = [];
    for (let [path, mount] of this.mounts) {
      if(mount.name !== "sys" && mount.name !== "scheme") {
        jso.push({
          path: path,
          name: mount.name,
          options: mount.options
        })        
      }
    }
    return jso;
  }

  persistMounts() {
    var mounts = this.mountsAsJso();
    console.log("persist mounts: " + mounts);
    focalStorage.setItem("lively4mounts", mounts);
  }

  async loadMounts() {
    let mounts = await focalStorage.getItem("lively4mounts");

    if (!mounts) {
      return;
    }

    try {
      for(let mount of mounts) {
        // #TODO #Hack I though relative paths are now suported in System.js 0.20 #Fuck?
        // let fs = await System.import('./fs/' + mount.name + '.js')
        
        // do nothing with sys fs... is already mounted
        if (mount.name === "sys") continue;
        if (mount.name === "scheme") continue;

        
        let fs = await System.import('./src/external/lively4-serviceworker/src/fs/' + mount.name + '.js');
        this.mount(mount.path, fs.default, mount.options);
      }
    } catch(e) {
      console.error(e)
    }
  }
}
