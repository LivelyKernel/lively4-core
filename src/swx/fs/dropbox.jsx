/*
 * HTTP Dropbox access.
 */

import { Base } from './base.jsx'
import * as util from '../util.jsx'

export default class Filesystem extends Base {
    constructor(path, options) {
        super('dropboxfs', path, options)

        if(options.bearer_token) {
            this.bearer_token = options.bearer_token
        } else {
            throw new Error("[dropbox] bearer auth token required")
        }

        if(options.subfolder) {
            this.subfolder = options.subfolder
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
        dropboxHeaders.append('Authorization', 'Bearer ' + this.bearer_token)
        let response = await self.fetch('https://api.dropboxapi.com/1/metadata/auto' + path, {headers: dropboxHeaders})

        if(response.status < 200 && response.status >= 300) {
            throw new Error(response.statusText)
        }

        let json    = await response.json()
        let content = do {
            if(json['contents']) {
                JSON.stringify({
                    type: 'directory',
                    contents: await* [for(item of json['contents']) this.statinfo(item)]
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
        dropboxHeaders.append('Authorization', 'Bearer ' + this.bearer_token)
        let response = await self.fetch('https://content.dropboxapi.com/1/files/auto' + path, {headers: dropboxHeaders})

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

        dropboxHeaders.append('Authorization', 'Bearer ' + this.bearer_token)
        dropboxHeaders.append("Content-Length", fileContentFinal.length.toString())
        let response = await self.fetch('https://content.dropboxapi.com/1/files_put/auto' + path, {method: 'PUT', headers: dropboxHeaders, body: fileContentFinal})

        if(response.status < 200 && response.status >= 300) {
            throw new Error(response.statusText)
        }

        return fileContent
    }
}
