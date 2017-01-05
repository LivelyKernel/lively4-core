/*
 * Sysfs for the important things.
 */

import { Base } from './base.js'
import * as swx from '../swx.js'

export default class SysFilesystem extends Base {
  constructor(path, swx) {
    super('sys', path)

    this.swx = swx

    let name = path.split(/\/+/)
    name = name[name.length - 1]

    this.tree = new SysDir(name, [
      new SysFile('mounts', () => {
        return this.swx.filesystem.mountsAsJso()
      }),
      new SysDir('swx', [
        new SysFile('reqcount', () => {
          return this.swx.filesystem.reqcount
        }),
        new SysFile('reload', null, function() {
          self.__reload__({force: true})
          return ""
        })
      ]),
      new SysDir('fs', [
        new SysFile('mount', null, content => this._sysFsMount(content)),
        new SysFile('umount', null, content => this._sysFsUmount(content))
      ])
    ])
  }



  async _sysFsMount(content) {
    let json = JSON.parse(await content)

    let path = json['path']
    let name = json['name']
    let opts = json['options'] || {}

    if(!path)
      throw new Error('<path> is missing')

    if(!name)
      throw new Error('<name> is missing')

    let fs = await System.import('/fs/' + name + '.js')

    swx.instance().filesystem.mount(path, fs.default, opts)

    swx.instance().filesystem.persistMounts()

    return json
  }

  async _sysFsUmount(content) {
    console.log("umount " + content)
    let json = JSON.parse(await content)
    let path = json['path']

    if(!path)
      throw new Error('<path> is missing')

    swx.instance().filesystem.umount(path)

    return json
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
      let contents = await Promise.all(
        Array.from(children, _ => _.statinfo({contents: false})))

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

    let [name, ...rest] = 
      typeof path === 'string' ? path.split(/\/+/) : path;

    if(name === '')
      return this

    let children = await this.children()
    let node   = children.find((child) => child.name === name)

    if(rest.length > 0) {
      if(node instanceof SysDir) {
        return node.resolve(rest)
      } else {
        throw new Error('ENOTDI could not resolve dir' + path)
      }
    } else if(node) {
      return node
    } else {
      throw new Error('ENOTFOUND could not resolve ' + path)
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
      let json   = await this.rfn()
      let content  = JSON.stringify(json, null, '\t')
      let response = new Response(content)

      return response
    } else {
      return File.prototype.read.call(this)
    }
  }

  async write(blob) {
    if(typeof this.wfn === 'function') {
      try {
        let json   = await this.wfn(blob)
        let content  = JSON.stringify(json, null, '\t')
        let response = new Response(content)

        return response
      } catch(err) {
        let message  = err.toString()
        let content  = JSON.stringify(message, null, '\t')
        let response = new Response(content, {status: 400, statusText: message})

        console.error(err)

        return response
      }
    } else {
      return File.prototype.write.call(this, blob)
    }
  }
}

