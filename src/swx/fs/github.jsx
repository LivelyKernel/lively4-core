/*
 * HTTP GitHub project access.
 */

import { Base } from './base.jsx'

export class Filesystem extends Base {
    constructor(path, options) {
        super(path, options)

        if(options.repo) {
            this.repo = options.repo
        } else {
            throw new Error("[github] repo option required")
        }
    }

    read(path) {
        return self.fetch('https://api.github.com/repos/' + this.repo + '/contents/' + path)
            .then((response) => {
                if(response.status >= 200 && response.status < 300) {
                    return response
                } else {
                    throw new Error(response.statusText)
                }
            })
            .then((result) => result.json())
            .then((json) => {
                if(json instanceof Array) {
                    return JSON.stringify({
                        contents: json.map((item) => {
                            return {name: item['name']}
                        })
                    })
                } else {
                    return atob(json['content'])
                }
            }).catch((err) => {
                console.error(err)
                return new Response(err, {status: 500})
            })
    }
}
