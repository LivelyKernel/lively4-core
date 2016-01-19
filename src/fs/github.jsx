/*
 * HTTP GitHub project access.
 */

import { Base } from './base.jsx'
import * as util from '../util.jsx'

export default class Filesystem extends Base {
    constructor(path, options) {
        super('githubfs', path, options)

        if(options.repo) {
            this.repo = options.repo
        } else {
            throw new Error("[github] repo option required")
        }

        if(options.token) {
            this.token = options.token
        }
    }

    async statinfo(json) {
        delete json['content']
        delete json['encoding']

        let type = 'file'

        if(json['type'] === 'dir')
            type = 'directory'

        return {
            type: type,
            name: json['name'],
            size: json['size']
        }
    }

    async stat(path) {
        let response = await self.fetch('https://api.github.com/repos/' + this.repo + '/contents/' + path)

        if(response.status < 200 || response.status >= 300) {
            return response
        }

        let json    = await response.json()
        let content = do {
            if(Array.isArray(json)) {
                JSON.stringify({
                    type: 'directory',
                    contents: await* [for(item of json) this.statinfo(item)]
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
        let response = await self.fetch('https://api.github.com/repos/' + this.repo + '/contents/' + path)

        if(response.status < 200 || response.status >= 300) {
            throw new Error(response.statusText)
        }

        let json = await response.json()

        if(Array.isArray(json)) {
            return new Response(null, {
                status: 405,
                statusMessage: 'EISDIR',
                headers: {'Allow': 'OPTIONS'}
            })
        } else {
            return new Response(atob(json['content']), {
                status: 200
            })
        }
    }

    async write(path, fileContent) {
        let githubHeaders = new Headers()

        githubHeaders.append('Authorization', 'token ' + this.token)
        let getResponse = await self.fetch('https://api.github.com/repos/' + this.repo + '/contents' + path, {headers: githubHeaders})

        if (getResponse.status != 200) {
            throw new Error(getResponse.statusText)
        }

        let getJson = await getResponse.json()

        if (Array.isArray(getJson)) {
            throw new Error('What you are trying to overwrite is not a file. It\'s a directory.')
        }

        if (getJson['type'] != 'file') {
            throw new Error('What you are trying to overwrite is not a file. It\'s a ' + getJson['type'] + '.')
        }

        let request = {
            message: 'Update file ' + path + ' with webclient file backend', 
            sha: getJson['sha'], 
            content: btoa(await fileContent)}

        let response = await self.fetch('https://api.github.com/repos/' + this.repo + '/contents/' + path, {
            headers: githubHeaders,
            body: JSON.stringify(request),
            method: 'PUT'})

        if(response.status < 200 || response.status >= 300) {
            throw new Error(response.statusText)
        }

        return fileContent
    }
}

// class GHFile extends File
