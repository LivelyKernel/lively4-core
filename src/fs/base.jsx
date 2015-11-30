/**
 * Basic file system base class.
 */
export class Base {
    constructor(path, options) {
        this.path = path
    }

    /**
     * Return stats about object at given path.
     *
     * @param  {String} path
     * @return {Promise}
     */
    stat(path) {

    }

    /**
     * Return content at given path.
     *
     * @param  {String} path
     * @return {Promise}
     */
    read(path) {

    }

    /**
     * Write content at given path.
     *
     * @param  {String} path
     * @param  {String} content
     * @return {Promise}
     */
    write(path, content) {

    }
}
