/**
 * Basic file system base class.
 */
export class Base {
  constructor(name, path, options) {
    this.path = path
    this.name = name
    this.options = options
  }

  /**
   * Return stats about object at given path.
   *
   * @param  {String} path
   * @return {Promise}
   */
  stat(path) {
    throw new StatNotFoundError()
  }

  /**
   * Return content at given path.
   *
   * @param  {String} path
   * @return {Promise}
   */
  read(path) {
    return Promise.resolve(new Response(null, {status: 405}))
  }

  /**
   * Write content at given path.
   *
   * @param  {String} path
   * @param  {String} content
   * @return {Promise}
   */
  write(path, content) {
    return Promise.resolve(new Response(null, {status: 405}))
  }
}

export class Stat {
  constructor(isDirectory, contents, allowed) {
    this.isDirectory = isDirectory
    this.contents = contents
    this.allowed = allowed
  }

  toResponse() {
    return new Response(this.contentToJson(), {
      status: 200,
      headers: {'Allow': this.allowedToHeader()}
    })
  }

  allowedToHeader() {
    return this.allowed.toString()
  }

  contentToJson() {
    if (this.isDirectory) {
      return JSON.stringify({
          type: 'directory',
          contents: this.contents
        }, null, '\t')
    }
    return JSON.stringify(this.contents, null, '\t')
  }
}

export class StatNotFoundError extends Error {
  constructor(message='No stat available for given path.') {
    super(message)
    this.name = 'StatNotFoundError'
  }
}
