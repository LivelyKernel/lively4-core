function open(cache_name) {
  return caches.open(cache_name)
}

export function put(request, response) {
  let blob_text = [Date.now().toString()]
  let blob_type = {type : 'text/html'}
  let blob = new Blob(blob_text, blob_type)
  let resp = new Response(blob)
  open('lively4-cache-line-ages').then((cache) => cache.put(request, resp))
  return open('lively4').then((cache) => cache.put(request, response))
}

export function purge(request) {
  open('lively4-cache-line-ages').then((cache) => cache.delete(request))
  return open('lively4').then((cache) => cache.delete(request))
}

export async function match(request, timeout=-1) {
  if (timeout != -1) {
    let age = await getAgeOf(request)
    console.log(age)
    let age_v = await age.text()
    if (age && Date.now() - parseInt(age_v) >= timeout) {
      purge(request)
      return Promise.resolve(undefined)
    }
  }
  return open('lively4').then((cache) => cache.match(request))
}

export function getAgeOf(request) {
  return open('lively4-cache-line-ages').then((cache) => cache.match(request))
}
