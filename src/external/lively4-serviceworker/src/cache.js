//import focalStorage from './external/focalStorage.js';

/*
  This class is supposed to be a general-purpose cache for HTTP requests with different HTTP methods.
  It currently uses the builtin cache for GET requests
*/
export class Cache {
  
  constructor(name) {
    // Set cache name
    this._name = name;
    
    // Set up focalStorage
    /*focalStorage.settings = {
      driver: focalStorage.indexedDB,
      name: this._name,
      version: 1,
      storeName: 'cache',
    };*/
  }
  
  /*
    Fetches a request from the cache or network, according to the caching strategy.
    To be used e.g. in `event.respondWith(...)`.
    Currently always loads from the cache if possible.
  */
  fetch(request, p) {
    // Check if the request is in the cache
    return this._match(request).then((response) => {
      if(response) {
        console.log(`SWX Cache hit: ${request.method} ${request.url}`);
        return response;
      } else {
        console.log(`SWX Cache miss: ${request.method} ${request.url}`);
        return p.then((response) => {
          return this._put(request, response);
        });
      }
    })
  }
  
  /*
    Checks if a request is in the cache
    @return Promise
  */
  _match(request) {
    return caches.match(request);
    //return focalStorage.getItem(this._buildKey(request));
  }
  
  /*
    Puts a response for a request in the cache
    @return Promise
  */
  _put(request, response) {
    return caches.open(this._name).then(function(cache) {
      // Builtin cache only supports GET requests
      if(request.method === 'GET') {
        cache.put(request, response.clone());
      }
      return response;
    });
    //return focalStorage.setItem(this._buildKey(request), response.clone());
  }
  
  /*
    Builds a key for the cache from a request
    @return String key
  */
  _buildKey(request) {
    return `${request.method} ${request.url}`;
  }
}



/* Old methods */
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

