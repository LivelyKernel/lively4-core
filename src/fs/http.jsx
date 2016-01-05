/*
 * Direct-HTTP read-only file system used to
 * access all unknown, default resources.
 */

import { Base } from './base.jsx'

export default class Filesystem extends Base {
    constructor(path, options) {
        super('httpfs', path, options)

        if(!options.base)
            throw new Error('Option `base` required.')

        this.base = options.base
    }

    read(path, request) {
        let req = new Request(this.base + '/' + path, request)

        return fetch(req)
    }

    write(path, _, request) {
        let req = new Request(this.base + '/' + path, request)

        return fetch(req)
    }

    stat(path, request) {
        let req = new Request(this.base + '/' + path, request)

        return fetch(req)
    }
}
