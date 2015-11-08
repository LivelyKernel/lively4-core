/*
 * Pseudo-HTTP github project access.
 */

export function read(path) {
    console.log('HTTP read: ' + path)

    return fetch(path).then((response) => {
        if(response.ok) {
            response.text()
        } else {
            throw new Error(`HTTPFS error: ${response.status} ${response.statusText}`)
        }
    })
}

export function list(path) {

}

export function stat(path) {

}
