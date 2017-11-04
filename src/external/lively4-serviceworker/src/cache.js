import { CacheStorage } from './cachestorage.js';
import { Queue } from './queue.js';
import Serializer from './serializer.js';
import * as msg from './messaging.js'

/**
 * This class is supposed to be a general-purpose cache for HTTP requests with different HTTP methods.
 * TODO: Rename this class to 'Proxy' and rename 'CacheStorage' to 'Cache'?
 */
export class Cache {
  constructor() {
    this._cacheStorage = new CacheStorage();
    this._queue = new Queue();
    
    // Define which HTTP methods need result caching, and which need request queueing
    this._cacheMethods = ['OPTIONS', 'GET'];
    this._queueMethods = ['PUT', 'POST'];
  }
  
  /**
   * Fetches a request from the cache or network, according to the caching strategy.
   * To be used e.g. in `event.respondWith(...)`.
   */
  fetch(request, p) {
    if(navigator.onLine) {
      // When online, handle requests normaly and store the result
      return p.then((response) => {
        // Currently, we only store OPTIONS and GET requests in the cache
        if(this._cacheMethods.includes(request.method)) {
          this._put(request, response);
        }
        return response;
      });
    } else {
      // When offline, check the cache or put request in queue
      if(this._cacheMethods.includes(request.method)) {
        // Check if the request is in the cache
        return this._match(request).then((response) => {
          if(response) {
            //console.log(`SWX Cache hit: ${request.method} ${request.url}`);
            msg.broadcast('Fulfilled request from cache.', 'warning');
            return Serializer.deserialize(response);
          } else {
            //console.log(`SWX Cache miss: ${request.method} ${request.url}`);
            msg.broadcast('Could not fulfil request from cache.', 'error');
            return p;
          }
        })
      } else if(this._queueMethods.includes(request.method)) {
        this._enqueue(request);
        return null
      }
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
    Serializer.serialize(response).then((serializedResponse) => {
      this._cacheStorage.put(this._buildKey(request), serializedResponse);
    })
    return response
  }
  
  /**
   * Checks if a request is in the queue
   * @return void
   */
  _enqueue(request) {
    Serializer.serialize(request).then((serializedRequest) => {
      this._queue.enqueue(serializedRequest);
    })
  }
  
  /**
   * Builds a key for the cache from a request
   * @return String key
   */
  _buildKey(request) {
    return `${request.method} ${request.url}`;
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

