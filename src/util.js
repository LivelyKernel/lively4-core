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

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
