export function responseOk(response) {
    if(response.status >= 200 && response.status < 300) {
        return response
    } else {
        throw new Error(response.statusText)
    }
}

export function responseToJson(response) {
    return response.json()
}
