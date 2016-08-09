export function responseOk(response, throwError=Error) {
  if(response.status >= 200 && response.status < 300) {
    return response
  } else {
    throw new throwError(response.statusText)
  }
}

export function responseToJson(response) {
  return response.json()
}

// Store array with mappings from numerical to hex representation
const _hexMap = Array.from(Array(0xff), (_, i) => (i + 0x100).toString(16).substr(1))

export function generateUUID() {
  let rand = new Uint8Array(16)

  crypto.getRandomValues(rand)

  rand[6] = (rand[6] & 0x0f) | 0x40;
  rand[8] = (rand[8] & 0x3f) | 0x80;

  return _hexMap[rand[0]] + _hexMap[rand[1]] +
         _hexMap[rand[2]] + _hexMap[rand[3]] + '-' +
         _hexMap[rand[4]] + _hexMap[rand[5]] + '-' +
         _hexMap[rand[6]] + _hexMap[rand[7]] + '-' +
         _hexMap[rand[8]] + _hexMap[rand[9]] + '-' +
         _hexMap[rand[10]] + _hexMap[rand[11]] +
         _hexMap[rand[12]] + _hexMap[rand[13]] +
         _hexMap[rand[14]] + _hexMap[rand[15]];
}
