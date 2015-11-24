/*
 * Pseudo-HTTP github project access.
 */

import { Base } from './base.jsx'

export class Filesystem extends Base {
    read(path) {
        return Promise.resolve(path)
    }
}
