import { Dictionary } from './dictionary.js';
import { Queue } from './queue.js';
import Serializer from './serializer.js';
import { ConnectionManager } from './connectionmanager.js';
import * as msg from './messaging.js'
import { FavoritesTracker } from './favoritestracker.js';

/**
 * This class is supposed to be a general-purpose cache for HTTP requests with different HTTP methods.
 */
export class Cache {
  
  /**
   * Constructs a new Cache object
   * @param fileSystem A reference to the filesystem. Needed to process queued filesystem requests.
   */
  constructor(fileSystem) {
    this._managesFavorits = true;
    this._dictionary = new Dictionary('response-cache');
    this._queue = new Dictionary('request-cache');
    this._favoritesTracker = new FavoritesTracker();
    this._connectionManager = new ConnectionManager();
    this._fileSystem = fileSystem;
    
    // Register for network status changes
    this._connectionManager.addListener('statusChanged', (status) => {
      if(status.isOnline) {
        // We're back online after being online
        // Process all queued requests
        this._processQueued();
      }
    });
    
    // Define which HTTP methods need result caching, and which need request queueing
    this._cacheMethods = ['OPTIONS', 'GET'];
    this._queueMethods = ['PUT', 'POST', 'DELETE'];
  }
  
  /**
   * Fetches a request from the cache or network, according to the caching strategy.
   * To be used e.g. in `event.respondWith(...)`.
   * @param request The request to respond to
   * @param doNetworkRequest A function to call if we need to send out a network request
   */
  fetch(request, doNetworkRequest) {
    if (this._managesFavorits) {
      this._favoritesTracker.update(request.url);
    }
    
    if (this._connectionManager.isOnline) {
      return this._onlineResponse(request, doNetworkRequest);
    } else {
      return this._offlineResponse(request);
    }
  }
  
  /**
   * Returns a response for online devices
   * @param request The request to respond to
   * @param doNetworkRequest A function to call if we need to send out a network request
   */
  _onlineResponse(request, doNetworkRequest) {
    // When online, handle requests normaly and store the result
    return doNetworkRequest().then((response) => {
      // Currently, we only store OPTIONS and GET requests in the cache
      if (this._cacheMethods.includes(request.method)) {
        this._put(request, response);
      }
      return response;
    });
  }
  
  /**
   * Returns a response for offline devices
   * @param request The request to respond to
   */
  _offlineResponse(request) {
    // When offline, check the cache or put request in queue
    if (this._cacheMethods.includes(request.method)) {
      // Check if the request is in the cache
      return this._match(request).then((response) => {
        if (response) {
          //msg.broadcast('Fulfilled request from cache.', 'warning');
          return Serializer.deserialize(response.value);
        } else {
          msg.broadcast('Could not fulfil request from cache.', 'error');
          console.error(`Not in cache: ${request.url}`);
          // At this point we know we are offline, so sending out the request is useless
          // Just create a fake error Response
          return this._buildNotCachedResponse();
        }
      })
    } else if (this._queueMethods.includes(request.method)) {
      this._enqueue(request);
      msg.broadcast('Queued write request.', 'warning');
      return this._buildEnqueuedResponse();
    }
  }
  
  /**
   * Checks if a request is in the cache
   * @return Promise
   */
  _match(request) {
    return this._dictionary.match(this._buildKey(request));
  }
  
  /**
   * Puts a response for a request in the cache
   * @return Response
   */
  _put(request, response) {
    Serializer.serialize(response).then((serializedResponse) => {
      this._dictionary.put(this._buildKey(request), serializedResponse);
    })
    return response;
  }
  
  /**
   * Checks if a request is in the queue
   * @return void
   */
  _enqueue(request) {
    // Serialize the Request object
    Serializer.serialize(request).then((serializedRequest) => {
      // Put the serialized request in the queue
      this._queue.put(this._buildKey(request), serializedRequest);
      
      // Update the cache content to pretend that the data has already been saved
      /* TODO: Directories (on PUT and DELETE)
       * - Check if containing Directory is cached
       * - Update cached content
       */
      let fileURL = new URL(serializedRequest.url)
      let filePathParts = fileURL.pathname.split('/');
      let fileName = filePathParts.pop();
      let folderURL = serializedRequest.url.slice(0, -fileName.length);
      
      // Check if we have the folder content cached
      const folderKey = `OPTIONS ${folderURL}`;
      this._dictionary.match(folderKey).then((response) => {
        if(response) {
          // We have the folder in the cache - update it
          let reader = new FileReader();
          reader.onload = () => {
            let folderJSON = JSON.parse(reader.result);
            let folderContainsFile = folderJSON.contents.find(e => e.name === fileName);
            if(!folderContainsFile && serializedRequest.method === 'PUT') {
              // Prepare new directory JSON
              folderJSON.contents.push({
                name: fileName,
                size: 0,
                type: 'file'
              });
              let folderBlob = new Blob([JSON.stringify(folderJSON)], {type : 'text/plain'});
              
              // Update cached directory JSON
              this._dictionary.match(folderKey).then((response) => {
                if(response) {
                  response.value.body = folderBlob;
                  this._dictionary.put(folderKey, response.value);
                }
              })
            } else if(folderContainsFile && serializedRequest.method === 'DELETE') {
              // Prepare new directory JSON
              folderJSON.contents = folderJSON.contents.filter(e => e.name !== fileName);
              let folderBlob = new Blob([JSON.stringify(folderJSON)], {type : 'text/plain'});
              
              // Update cached directory JSON
              this._dictionary.match(folderKey).then((response) => {
                if(response) {
                  response.value.body = folderBlob;
                  this._dictionary.put(folderKey, response.value);
                }
              })
            }
          }
          reader.readAsText(response.value.body);
        }
      });
      
      // Update file content
      const key = `GET ${serializedRequest.url}`;
      this._dictionary.match(key).then((response) => {
        if(response) {
          response.value.body = serializedRequest.body;
          this._dictionary.put(key, response.value);
        }
      })
    })
  }
  
  /**
   * Processes all queued requests by sending them in the same order
   */
  _processQueued() {
    console.warn("Should process queued");
    let processNext = () => {
      // Get oldest entry
      this._queue.pop().then((serializedRequest) => {
        // Check if we are done
        if(!serializedRequest) {
          return;
        }
        
        // Send request
        Serializer.deserialize(serializedRequest).then((request) => {
          let url = new URL(request.url);
          if(url.hostname === 'lively4') {
            this._fileSystem.handle(request, url).then(processNext);
          } else {
            fetch(request).then(processNext);
          }
        });
      });
    }
    
    // Start processing queued requests
    processNext();
  }
  
  /**
   * Builds a key for the cache from a request
   * @return String key
   */
  _buildKey(request) {
    // Ignore params when loading start.html
    // The file always has the same content, and we want to boot offline whenever possible
    let requestUrl = new URL(request.url);
    if(requestUrl.origin == self.location.origin && requestUrl.pathname.endsWith('start.html')) {
      return `${request.method} ${requestUrl.origin}/${requestUrl.pathname}`;
    }
    
    return `${request.method} ${request.url}`;
  }
  
  /**
   * Builds a fake success Response to return when a Request is enqueued
   * @return Response
   */
  _buildEnqueuedResponse() {
    return new Response(null, {
      status: 202,
      statusText: 'Accepted'
    });
  }
  
  /**
   * Builds a fake error Response to return when offline and not cached
   * @return Response
   */
  _buildNotCachedResponse() {
    let errorText = 'You are offline and the requested file was not found in the cache.';
    return new Response(errorText, {
      status: 503,
      statusText: 'Service Unavailable'
    });
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

