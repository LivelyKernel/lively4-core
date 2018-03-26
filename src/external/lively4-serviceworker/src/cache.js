// This could be a really good COP example... if "import" would not be so magical... #Research #COP #COPWorkshop
import { Dictionary as IndexDBDictionary} from './dictionary.js';
import { Dictionary as CacheDictionary } from './cache-dictionary.js'; 

import Serializer from './serializer.js';
import { ConnectionManager } from './connectionmanager.js';
import * as msg from './messaging.js'
import { FavoritesTracker } from './favoritestracker.js';
import {
  buildKey,
  buildEnqueuedResponse,
  buildNotCachedResponse,
  buildEmptyFileResponses,
  buildEmptyFolderResponse,
  buildNetworkRequestFunction,
  joinUrls
} from './util.js';
import focalStorage from '../../focalStorage.js';

let useCacheDictionary = false; // #Dev #Experimental

if (useCacheDictionary) {
  var Dictionary = CacheDictionary
} else {
  Dictionary = IndexDBDictionary
}


/**
 * This class is supposed to be a general-purpose cache for HTTP requests with different HTTP methods.
 */
export class Cache {
  
  /**
   * Constructs a new Cache object
   * @param fileSystem A reference to the filesystem. Needed to process queued filesystem requests.
   */
  constructor(fileSystem) {
    this._responseCache = new Dictionary('response-cache');
    this._requestCache = new Dictionary('request-cache');
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
    
    // Register for cache data requests from the client
    self.addEventListener('message', (e) => { 
      let message = e.data;
      
      if(message.type && message.command && message.type === 'dataRequest') {
        this._receiveFromClient(message.command, message.data);
      }
    });
    
    this._initCacheMode();
    
    // Define which HTTP methods need result caching, and which need request queueing
    this._cacheMethods = ['OPTIONS', 'GET'];
    this._queueMethods = ['PUT', 'POST', 'DELETE', 'MKCOL'];
  }
  
  /**
   * Fetches a request from the cache or network, according to the caching strategy.
   * To be used e.g. in `event.respondWith(...)`.
   * @param request The request to respond to
   * @param doNetworkRequest A function to call if we need to send out a network request
   */
  fetch(request, doNetworkRequest) {
    // console.log("request " + request.url)
    var start = performance.now()
    return new Promise(resolve => {
      if (this._cacheMode == 2) {
        this._favoritesTracker.update(request.url);
      }
      
      if (this._connectionManager.isOnline) {
        resolve(this._onlineResponse(request, doNetworkRequest, this._cacheMode > 0));
      } else if (this._cacheMode > 0) {
        resolve(this._offlineResponse(request));
      }
    }).then(r => {
      // console.log("resolved " + request.url + " in " + (performance.now() - start) +"ms")
      return r
    })
  }
  
  getCacheMode() {
    return this._cacheMode;
  }
  
  _initCacheMode() {
    // Set default cache mode
    const instanceName = lively4url.split("/").pop();
    this._cacheModeKey = `${instanceName}-cacheMode`;
    focalStorage.getItem(this._cacheModeKey).then(
      (cacheMode) => {
        if (cacheMode === null) {
          focalStorage.setItem(this._cacheModeKey, 2);
          this._cacheMode = 2;
        } else {
          this._cacheMode = cacheMode;
        }
      }
    )
  }
  
  /**
   * Returns a response for online devices
   * @param request The request to respond to
   * @param doNetworkRequest A function to call if we need to send out a network request
   * @param putInCache Whether the Response should be put into the cache
   */
  _onlineResponse(request, doNetworkRequest, putInCache) {
    // When online, handle requests normaly and store the result
    return doNetworkRequest().then((response) => {
      // Currently, we only store OPTIONS and GET requests in the cache
      if (this._cacheMethods.includes(request.method) && putInCache) {
        this._put(request, response.clone());
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
      // var timeMatchStart = performance.now()
      return this._match(request).then((response) => {
        // console.log("match " +request.url + " took " + (performance.now() - timeMatchStart) + "ms" )
        if (response) {
          if (useCacheDictionary) {
            return response.clone()
          } else {
            return Serializer.deserialize(response.value);
          }
        } else {
          msg.notify('error', 'Could not fulfil request from cache');
          console.error(`Not in cache: ${request.url}`);
          // At this point we know we are offline, so sending out the request is useless
          // Just create a fake error Response
          return buildNotCachedResponse();
        }
      })
    } else if (this._queueMethods.includes(request.method)) {
      return this._enqueue(request).then(() => {
        msg.notify('warning', 'Queued write request');
        return buildEnqueuedResponse();
      });
    }
  }
  
  /**
   * Checks if a request is in the cache
   * @return Promise
   */
  _match(request) {
    return this._responseCache.match(buildKey(request));
  }
  
  /**
   * Puts a response for a request in the cache
   * @return Response
   */
  _put(request, response) {
    if (useCacheDictionary) {
      this._responseCache.put(buildKey(request), response);
    } else {
      Serializer.serialize(response).then((serializedResponse) => {
        this._responseCache.put(buildKey(request), serializedResponse);
      })
    }
    
    return response;
  }
  
  /**
   * Puts a request in the queue to be sent out later
   * @return void
   */
  async _enqueue(request) {
    // Serialize the Request object
    
    let serializedRequest = request
    if (!useCacheDictionary) {
      serializedRequest = await Serializer.serialize(request);
    }
    // Put the serialized request in the queue
    this._requestCache.put(buildKey(request), serializedRequest);

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
    let response = await this._responseCache.match(folderKey);
    if(response) {
      // We have the folder in the cache - update it
      // FileReader does not use Promises, so we have to wrap it   
      await new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = async () => {
          let folderJSON = JSON.parse(reader.result);
          let folderContainsFile = folderJSON.contents.find(e => e.name === fileName);
          if(!folderContainsFile && (serializedRequest.method === 'PUT' || serializedRequest.method === 'MKCOL')) {
            // Newly created file/folder
            const typeForMethod = {
              'PUT'   : 'file',
              'MKCOL' : 'directory'
            };
            
            // Prepare new directory JSON
            folderJSON.contents.push({
              name: fileName,
              size: 0,
              type: typeForMethod[serializedRequest.method]
            });
            let folderBlob = new Blob([JSON.stringify(folderJSON)], {type : 'text/plain'});

            // Update cached directory JSON
            response = await this._responseCache.match(folderKey);
            if(response) {
              response.value.body = folderBlob;
              await this._responseCache.put(folderKey, response.value);
              resolve();
            }
          } else if(folderContainsFile && serializedRequest.method === 'DELETE') {
            // Deleted file
            // Prepare new directory JSON
            folderJSON.contents = folderJSON.contents.filter(e => e.name !== fileName);
            let folderBlob = new Blob([JSON.stringify(folderJSON)], {type : 'text/plain'});

            // Update cached directory JSON
            response = await this._responseCache.match(folderKey);
            if(response) {
              response.value.body = folderBlob;
              await this._responseCache.put(folderKey, response.value);
              resolve();
            }
          } else {
            // Normal file change, no need to update folder
            resolve();
          }
        }
        reader.readAsText(response.value.body);
      });
    }

    // Update file/folder content
    const key = `GET ${serializedRequest.url}`;
    response = await this._responseCache.match(key);
    if(response) {
      // The file is already in the cache - update the value
      response.value.body = serializedRequest.body;
      this._responseCache.put(key, response.value);
    } else {
      // The file/folder is not yet in the cache (probably newly created)
      // Create a fake entry with an empty file/folder
      if (serializedRequest.method === 'PUT') {
        // Empty file
        const responses = buildEmptyFileResponses();
        for (let method in responses) {
          let serializedResponse = await Serializer.serialize(responses[method]);
          await this._responseCache.put(`${method} ${serializedRequest.url}`, serializedResponse);
        }
      } else if (serializedRequest.method === 'MKCOL') {
        // Empyt folder
        let serializedResponse = await Serializer.serialize(buildEmptyFolderResponse());
        await this._responseCache.put(`OPTIONS ${serializedRequest.url}`, serializedResponse);
      }
    }
  }
  
  /**
   * Processes all queued requests by sending them in the same order
   */
  async _processQueued() {
    let queueEntries = await this._requestCache.toArray();
    if (queueEntries.length === 0) return;
    
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
      await this._requestCache.delete(queueEntry.key);
    }
    
    msg.notify('info', 'Processed all queued requests');
  }
  
  /**
   * Preloads a file into the cache
   * @param fileAddress The address of the file to preload
   */
  async preloadFile(fileAddress) {
    let ret = {};
    for(let method of this._cacheMethods) {
      let request = new Request(fileAddress, {
        method: method 
      });

      // Just tell the cache to fetch the file
      // This will update our cache if we are online
      let response = await this.fetch(request, buildNetworkRequestFunction(request, this._fileSystem));
      ret[method] = response.clone();
    }
    return ret;
  }
  
  /**
   * Preloads a directory into the cache
   * @param directoryAddress The address of the directory to preload
   */
  async preloadDirectory(directoryAddress) {
    let ret = {};
    let request = new Request(directoryAddress, {
      method: "OPTIONS" 
    });

    // Just tell the cache to fetch the file
    // This will update our cache if we are online
    let response = await this.fetch(request, buildNetworkRequestFunction(request, this._fileSystem));
    ret["OPTIONS"] = response.clone();
    return ret;
  }
  
  async _preloadFull(url) {
    let loadDirectory = async (directoryUrl) => {
      // Load directory index
      let directoryIndex = await this.preloadDirectory(directoryUrl);
      
      try {
        let directoryJson = await directoryIndex['OPTIONS'].json();
        for (let file of directoryJson.contents) {
          if (file.name[0] === '.') continue;

          // Using own joinUrls() because join() in path.js assumes paths, not URLs
          let newFileUrl = joinUrls(directoryUrl, file.name);

          if (file.type === 'file') {
            this.preloadFile(newFileUrl);
          } else if (file.type === 'directory') {
            await loadDirectory(newFileUrl);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    await loadDirectory(url);
  }
  
  /**
   * Handles a data request from a client
   */
  async _receiveFromClient(command, data) {
    let responseCommand;
    let responseData;
    
    switch (command) {
      case 'cacheKeys':
        responseCommand = command;
        let cachedData = await this._responseCache.toArray();
        responseData = cachedData.map(e => e[0]);
        break;
      case 'cacheValue':
        if (data) {
          responseCommand = command;
          responseData = await this._responseCache.match(data);
        }
        break;
      case 'clearCache':
        await await this._responseCache.clear();
        responseCommand = "clearCacheDone";
        break;
      case 'preloadFull':
        await this._preloadFull(data);
        responseCommand = 'fullLoadingDone';
        break;
      case 'updateCacheMode':
        this._cacheMode = data;
        break;
      default:
        console.warn(`Unknown request received from client: ${command}: ${data}`)
    }
    
    if (responseCommand) {
      this._respondToClient(responseCommand, responseData);
    }
  }
  
  /**
   * Sends a data response to the client
   */
  _respondToClient(command, data) {
    msg.sendData(command, data);
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

