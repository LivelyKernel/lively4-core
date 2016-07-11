


/*
 * Direct-HTTP read-only file system used to
 * access all unknown, default resources.
 */

import { Base } from './base.jsx'

export default class Filesystem extends Base {
  constructor(path, options) {
    super('root', path, options)

  }

  async read(path, request) {
    throw new Error('Not implemented yet')
  }

  async write(path, content, request) {
    throw new Error('Not implemented yet')
  }

  async stat(path, request) {
    throw new Error('Not implemented yet')
  }


}

