import { Dictionary } from './dictionary.js';
import Serializer from './serializer.js';
import { ConnectionManager } from './connectionmanager.js';
import * as msg from './messaging.js'
import { FavoritesTracker } from './favoritestracker.js';
import {
  buildKey,
  buildEnqueuedResponse,
  buildNotCachedResponse,
  buildEmptyFileResponses,
  buildNetworkRequestFunction
} from './util.js';

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
    this._favoritesTracker = new FavoritesTracker(this);
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
          return buildNotCachedResponse();
        }
      })
    } else if (this._queueMethods.includes(request.method)) {
      return this._enqueue(request).then(() => {
        msg.broadcast('Queued write request.', 'warning');
        return buildEnqueuedResponse();
      });
    }
  }
  
  /**
   * Checks if a request is in the cache
   * @return Promise
   */
  _match(request) {
    return this._dictionary.match(buildKey(request));
  }
  
  /**
   * Puts a response for a request in the cache
   * @return Response
   */
  _put(request, response) {
    Serializer.serialize(response).then((serializedResponse) => {
      this._dictionary.put(buildKey(request), serializedResponse);
    })
    return response;
  }
  
  /**
   * Puts a request in the queue to be sent out later
   * @return void
   */
  async _enqueue(request) {
    // Serialize the Request object
    let serializedRequest = await Serializer.serialize(request);
   
    // Put the serialized request in the queue
    this._queue.put(buildKey(request), serializedRequest);

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
    let response = await this._dictionary.match(folderKey);
    if(response) {
      // We have the folder in the cache - update it
      // FileReader does not use Promises, so we have to wrap it   
      await new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = async () => {
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
            response = await this._dictionary.match(folderKey);
            if(response) {
              response.value.body = folderBlob;
              await this._dictionary.put(folderKey, response.value);
              resolve();
            }
          } else if(folderContainsFile && serializedRequest.method === 'DELETE') {
            // Prepare new directory JSON
            folderJSON.contents = folderJSON.contents.filter(e => e.name !== fileName);
            let folderBlob = new Blob([JSON.stringify(folderJSON)], {type : 'text/plain'});

            // Update cached directory JSON
            response = await this._dictionary.match(folderKey);
            if(response) {
              response.value.body = folderBlob;
              await this._dictionary.put(folderKey, response.value);
              resolve();
            }
          }
        }
        reader.readAsText(response.value.body);
      });
    }

    // Update file content
    const key = `GET ${serializedRequest.url}`;
    response = await this._dictionary.match(key);
    if(response) {
      // The file is already in the cache - update the value
      response.value.body = serializedRequest.body;
      this._dictionary.put(key, response.value);
    } else {
      // The file is not yet in the cache (probably newly created)
      // Create a fake entry with an empty file
      const responses = buildEmptyFileResponses();
      for (let method in responses) {
        let serializedResponse = await Serializer.serialize(responses[method])
        await this._dictionary.put(`${method} ${serializedRequest.url}`, serializedResponse);
      }
    }
  }
  
  /**
   * Processes all queued requests by sending them in the same order
   */
  async _processQueued() {
    let queueEntries = await this._queue.toArray();
    
    // Sort queueEntries by ascending by timestamp
    queueEntries.sort(function(first, second) {
      return first[1].timestamp - second[1].timestamp;
    });
    
    queueEntries = queueEntries.map((e) => {
      return {
        key: e[0],
        serializedRequest: e[1].value
      }
    });
    
    // Process requests
    for (let queueEntry of queueEntries) {
      // Send request
      const request = await Serializer.deserialize(queueEntry.serializedRequest)
      let url = new URL(request.url);
      if(url.hostname === 'lively4') {
        await this._fileSystem.handle(request, url)
      } else {
        await fetch(request);
      }
      
      // Remove from queue
      await this._queue.delete(queueEntry.key);
    }
  }
  
  /**
   * Preloads a file into the cache
   * @param fileAddress The address of the file to preload
   */
  preloadFile(fileAddress) {
    for(let method of this._cacheMethods) {
      let request = new Request(fileAddress, {
        method: method 
      });

      // Just tell the cache to fetch the file
      // This will update our cache if we are online
      this.fetch(request, buildNetworkRequestFunction(request));
    }
  }
  
}



/* Old methods used by filesystems */
function warnOldCacheMethod(methodName) {
  console.warn(`Old cache method called: ${methodName}`);
}

function open(cache_name) {
  warnOldCacheMethod(arguments.callee.name);
  return caches.open(cache_name)
}

export function put(request, response) {
  warnOldCacheMethod(arguments.callee.name);
  let blob_text = [Date.now().toString()]
  let blob_type = {type : 'text/html'}
  let blob = new Blob(blob_text, blob_type)
  let resp = new Response(blob)
  open('lively4-cache-line-ages').then((cache) => cache.put(request, resp))
  return open('lively4').then((cache) => cache.put(request, response))
}

export function purge(request) {
  warnOldCacheMethod(arguments.callee.name);
  open('lively4-cache-line-ages').then((cache) => cache.delete(request))
  return open('lively4').then((cache) => cache.delete(request))
}

export async function match(request, timeout=-1) {
  warnOldCacheMethod(arguments.callee.name);
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
  warnOldCacheMethod(arguments.callee.name);
  return open('lively4-cache-line-ages').then((cache) => cache.match(request))
}

