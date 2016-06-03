/*
 * HTTP Dropbox access.
 */

import { Base } from './base.js'
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

  async stat(path) {
    let dropboxHeaders = new Headers()
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token) // Bearer
    let response = await self.fetch('https://api.dropboxapi.com/1/metadata/auto' + this.subfolder + path, {headers: dropboxHeaders})

    if(response.status < 200 && response.status >= 300) {
      throw new Error(response.statusText)
    }

    let json  = await response.json()
    let content = do {
      if(json['contents']) {
        JSON.stringify({
          type: 'directory',
          contents: await Promise.all(
            Array.from(json['contents'], item => this.statinfo(item)))
        }, null, '\t')
      } else {
        JSON.stringify(await this.statinfo(json), null, '\t')
      }
    }

    return new Response(content, {
      status: 200,
      headers: {'Allow': 'GET,OPTIONS'}
    })
  }

  async read(path) {
    let dropboxHeaders = new Headers()
    dropboxHeaders.append('Authorization', 'Bearer ' + this.token)
    let response = await self.fetch('https://content.dropboxapi.com/1/files/auto' + this.subfolder + path, {headers: dropboxHeaders})

    if(response.status < 200 && response.status >= 300) {
      throw new Error(response.statusText)
    }

    let blob = await response.blob()

    return new Response(blob, {
      status: 200
    })
  }

  async write(path, fileContent) {
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
