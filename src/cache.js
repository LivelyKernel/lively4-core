function open() {
  return caches.open('lively4')
}

export function put(request, response) {
  return open().then((cache) => cache.put(request, response))
}

export function purge(request) {
  return open().then((cache) => cache.delete(request))
}

export function match(request) {
  return open().then((cache) => cache.match(request))
}
