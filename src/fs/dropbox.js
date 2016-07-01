/*
 * HTTP Dropbox access.
 */

import { Base, Stat, StatNotFoundError } from './base.js'
import * as util from '../util.js'

export default class Filesystem extends Base {
  constructor(path, options) {
    super('dropbox', path, options)

    if(options.token) {
      this.token = options.token
    } else {
      throw new Error("[dropbox] bearer auth token required")
    }

    if(options.subfolder) {
      this.subfolder = options.subfolder
      if (this.subfolder[0] != '/') {
        this.subfolder = '/' + this.subfolder
      }
    } else {
      this.subfolder = ''
    }
  }

  async statinfo(json) {
    let type = 'file'
    let name = json['path'].split('/').pop()

    if(json['is_dir'] === true)
      type = 'directory'

    return {
      type: type,
      name: name,
      size: json['size']
    }
  }

  async stat(path, unused_request, no_cache=false) {
    let dropboxHeaders = new Headers()
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token) // Bearer

    let request = new Request('https://api.dropboxapi.com/1/metadata/auto' + this.subfolder + path, {headers: dropboxHeaders})

    let response = undefined

    if (!no_cache) {
      response = await cache.match(request)
    } else {
      cache.purge(request);
    }

    if (response === undefined) {
      response = await self.fetch(request)
      cache.put(request, response)
      response = response.clone()
    }

    util.responseOk(response, StatNotFoundError)

    let json  = await response.json()
    let dir = false
    let contents = do {
      if(json['contents']) {
        dir = true
        await Promise.all(Array.from(json['contents'], item => this.statinfo(item)))
      } else {
        await this.statinfo(json)
      }
    }

    return new Stat(dir, contents, ['GET', 'OPTIONS'])
  }

  async read(path, unused_request, no_cache=false) {
    let dropboxHeaders = new Headers()
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token)

    let request = new Request('https://content.dropboxapi.com/1/files/auto' + this.subfolder + path, {headers: dropboxHeaders})

    let response = undefined

    if (!no_cache) {
      response = await cache.match(request)
    } else {
      cache.purge(request);
    }

    if (response === undefined) {
      response = await self.fetch(request)
      cache.put(request, response)
      response = response.clone()
    }

    util.responseOk(response, FileNotFoundError)

    let blob = await response.blob()

    return new File(blob)
  }

  async write(path, fileContent, unused_request) {
    let fileContentFinal = await fileContent
    let dropboxHeaders = new Headers()

    dropboxHeaders.append('Authorization', 'Bearer ' + this.token)
    dropboxHeaders.append("Content-Length", fileContentFinal.length.toString())
    let response = await self.fetch('https://content.dropboxapi.com/1/files_put/auto' + this.subfolder + path, {method: 'PUT', headers: dropboxHeaders, body: fileContentFinal})

    if(response.status < 200 && response.status >= 300) {
      throw new Error(response.statusText)
    }

    return fileContent
  }
}
