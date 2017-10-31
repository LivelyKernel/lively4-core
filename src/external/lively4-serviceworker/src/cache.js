import { CacheStorage } from './cachestorage.js';

/**
 * This class is supposed to be a general-purpose cache for HTTP requests with different HTTP methods.
 * It currently uses the builtin cache for GET requests
 */
export class Cache {
  constructor(name) {
    // Set cache name
    this._name = name;
    this._cacheStorage = new CacheStorage();
  }
  
  /**
   * Fetches a request from the cache or network, according to the caching strategy.
   * To be used e.g. in `event.respondWith(...)`.
   */
  fetch(request, p) {
    if(navigator.onLine) {
      //console.log('Online');
      return p.then((response) => {
        return this._put(request, response);
      });
    } else {
      //console.log('Offline');
      // Check if the request is in the cache
      return this._match(request).then((response) => {
        if(response) {
          //console.log(`SWX Cache hit: ${request.method} ${request.url}`);
          return this._deserializeResponse(response);
        } else {
          //console.log(`SWX Cache miss: ${request.method} ${request.url}`);
          return p.then((response) => {
            return this._put(request, response);
          });
        }
      })
    }
  }
  
  /**
   * Checks if a request is in the cache
   * @return Promise
   */
  _match(request) {
    return this._cacheStorage.match(this._buildKey(request));
  }
  
  /**
   * Puts a response for a request in the cache
   * @return Response
   */
  _put(request, response) {
    this._serializeResponse(response).then((serializedResponse) => {
      this._cacheStorage.put(this._buildKey(request), serializedResponse);
    })
    return response
  }
  
  /**
   * Builds a key for the cache from a request
   * @return String key
   */
  _buildKey(request) {
    return `${request.method} ${request.url}`;
  }
  
  /**
   * Serializes a Response object to be stored in the CachStorage
   * @param respones The Response object
   * @return Dict A dictionary containing the serialized data
   */
  async _serializeResponse(response) {    
    // Serialize headers
    let serializedHeaders = {};
    for (let pair of response.headers.entries()) {
       serializedHeaders[pair[0]] = pair[1];
    }
    
    // Serialize body
    const blob = await response.clone().blob();

    // Build serialized response
    const serializedResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: serializedHeaders,
      body: blob
    };
    
    return serializedResponse;
  }
  
  /**
   * Deserializes a serialized response dictionary returned from the CachStorage
   * @param serializedResponse A dictionary containing the serialized data
   * @return Response object
   */
  _deserializeResponse(serializedResponse) {
    return new Response(
      serializedResponse.body,
      {
        status: serializedResponse.status,
        statusText: serializedResponse.statusText,
        headers: new Headers(serializedResponse.headers)
      }
    );
  }
}



/* Old methods used by filesystems */
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

