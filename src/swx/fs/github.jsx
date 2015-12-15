/*
 * HTTP GitHub project access.
 */

import { Base } from './base.jsx'
import * as util from '../util.jsx'

export default class Filesystem extends Base {
    constructor(path, fs, options) {
        super('githubfs', path, fs, options)

        if(options.repo) {
            this.repo = options.repo
        } else {
            throw new Error("[github] repo option required")
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

        if(response.status < 200 && response.status >= 300) {
            throw new Error(response.statusText)
        }

        let json    = response.json()
        let content = do {
            if(Array.isArray(json)) {
                JSON.stringify({
                    type: 'directory',
                    contents: [await this.statinfo(item) for(item of json)]
                }, null, '\t')
            } else {
                JSON.stringify(this.statinfo(json), null, '\t')
            }
        }

        return new Response(content, {
            status: 200,
            headers: {'Allow': 'GET,OPTIONS'}
        })
    }

    async read(path) {
        let response = await self.fetch('https://api.github.com/repos/' + this.repo + '/contents/' + path)

        if(response.status < 200 && response.status >= 300) {
            throw new Error(response.statusText)
        }

        let json = response.json()

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
}

// class GHFile extends File
