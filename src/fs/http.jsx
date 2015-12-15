/*
 * Direct-HTTP read-only file system used to
 * access all unknown, default resources.
 */

import { Base } from './base.jsx'

export default class Filesystem extends Base {
    read(path) {
        return fetch(path).then((response) => {
            if(response.ok) {
                response.text()
            } else {
                throw new Error(`httpfs error: ${response.status} ${response.statusText}`)
            }
        })
    }
}
