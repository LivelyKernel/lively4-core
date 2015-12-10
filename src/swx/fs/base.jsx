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
        return Promise.resolve(new Response(null, {status: 405}))
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
