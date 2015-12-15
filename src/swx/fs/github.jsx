/*
 * HTTP GitHub project access.
 */

import { Base } from './base.jsx'
import * as util from '../util.jsx'

export class Filesystem extends Base {
    constructor(path, options) {
        super('githubfs', path, options)

        if(options.repo) {
            this.repo = options.repo
        } else {
            throw new Error("[github] repo option required")
        }
    }

    _file_stat(json) {
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

    stat(path) {
        return self.fetch('https://api.github.com/repos/' + this.repo + '/contents/' + path)
            .then(util.responseOk)
            .then(util.responseToJson)
            .then((json) => {
                let headers = new Headers()
                var json

                headers.append('Allow', 'GET,OPTIONS')

                if(json instanceof Array) {
                    json = JSON.stringify({
                        type: 'directory',
                        contents: json.map((item) => this._file_stat(item))
                    }, null, '\t')
                } else {
                    json = JSON.stringify(this._file_stat(json), null, '\t')
                }

                return new Response(json, {status: 200, headers: headers})
            })
    }

    read(path) {
        return self.fetch('https://api.github.com/repos/' + this.repo + '/contents/' + path)
            .then(util.responseOk)
            .then(util.responseToJson)
            .then((json) => {
                if(json instanceof Array) {
                    let headers = new Headers()
                    headers.append('Allow', 'OPTIONS')
                    return new Response(null, {status: 405, statusMessage: 'EISDIR', headers: headers})
                } else {
                    return atob(json['content'])
                }
            }).catch((err) => {
                console.error(err)
                return new Response(err, {status: 500})
            })
    }
}

// class GHFile extends File
