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
  try {
    if (timeout != -1) {
      let age = await getAgeOf(request) 
      if (!age) return Promise.resolve(undefined)

      
      let age_v = await age.text()

      if (age && Date.now() - parseInt(age_v) >= timeout) {
        purge(request)
        return Promise.resolve(undefined)
      }
    }

    let cache = await open('lively4')
    let match = await cache.match(request)

    return match
  } catch(e) {
    console.warn('Error happened while matching cache:', e)

    return Promise.resolve(undefined)
  }
}

export function getAgeOf(request) {
  return open('lively4-cache-line-ages').then((cache) => cache.match(request))
}
