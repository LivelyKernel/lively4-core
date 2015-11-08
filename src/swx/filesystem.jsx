/*
 *
 */

import * as http from 'src/swx/fs/http.jsx'

export function read(request) {
    return http.read(request.url)
}
