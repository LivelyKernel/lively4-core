/*
 * Lively4 Service Worker
 */

/* globals pendingRequests:true lively4performance lively4stamp*/

import * as fs from './filesystem.js'
import * as msg from './messaging.js'

import sysfs from './fs/sys.js'
import httpfs from './fs/http.js'
import html5fs from './fs/html5.js'
import githubfs from './fs/github.js'
import dropboxfs from './fs/dropbox.js'
import schemefs from './fs/scheme.js'

import focalStorage from './external/focalStorage.js';

import { Cache } from './cache.js';

const storagePrefix = "LivelySync_";

// BEGIN copied from src/client/boot/js
self.lively4performance = {start: performance.now()}
try {
  self.lively4stamp = function() {
      if (!self.lively4performance) return;
      var newLast = performance.now()
      var t = (newLast - (lively4performance.last || lively4performance.start)) / 1000
      lively4performance.last = newLast
      return (t.toFixed(3) + "s ")
  }
  
} catch(e) {
  console.error(e)
}
// END

class ServiceWorker {
  constructor() {
    this.filesystem = new fs.Filesystem();

    // default file system
    // this.filesystem.mount('/', githubfs, {repo: 'LivelyKernel/Lively4', branch: 'master'}); // mounting lively4-core is to irritating
    this.filesystem.mount('/', sysfs, this);
    this.filesystem.mount('/sys', sysfs, this);
    this.filesystem.mount('/scheme', schemefs, this);
    this.filesystem.mount('/local', html5fs);

    // here we should remount previous filesystem (remembered in focalStorage)
    
    // doing this on every request is very expensive
    this.promisedEmail = focalStorage.getItem(storagePrefix+ "githubEmail")
    this.promisedUsername = focalStorage.getItem(storagePrefix+ "githubUsername")
    this.promisedToken = focalStorage.getItem(storagePrefix+ "githubToken")
    
    // Create cache
    this._cache = new Cache(this.filesystem);
  }

  static instance() {
    // var startTime = Date.now();
    var instance = new ServiceWorker();
    __instance__ = instance; // Global side effect #TODO

    return instance.filesystem.loadMounts().then( () => {
      // console.log("mount FS in" + (Date.now() - startTime) + "ms");

      instance.resolvePendingRequests();
      return instance;
    })
  }

  resolvePendingRequests() {
    // DR: `pendingRequests` is defined during boot, but for later requests it did not exist, so the original check caused a ReferenceError
    if (typeof pendingRequests === 'undefined' || !pendingRequests) {
      // console.log("no pending requests");
      return;
    }
    // console.log("resolve pending requests: " + pendingRequests);
    // #Hack needed, because the swx-solved loads asyncronously and the service worker expects and syncronouse answer or promise. 
    pendingRequests.forEach(ea => {
      console.log("work on pendingRequest " + ea.url);
      this.fetch(ea.event, ea);
    });
    // stop listening to requests..
    pendingRequests = null; 
    
  }
  
  fetchLively4authenticated(request) {
    return new Promise(async (resolve) => {
      var authentificationNeeded = !(request.method == "HEAD" || request.method == "GET" || request.method == "OPTIONS"); 
      // we have to manually recreate a request, because you cannot modify the original
      // see http://stackoverflow.com/questions/35420980/how-to-alter-the-headers-of-a-request
      var options = {
        method: request.method,
        headers: new Headers(), 
        mode: request.mode,
        credentials: request.credentials,
        redirect: request.redirect 
      }
      
      if (request.method == "PUT") {
        options.body =  await request.blob();
      }

      for (var pair of request.headers.entries()) {
        options.headers.set(pair[0], pair[1]);
      }

      if (authentificationNeeded) {
        await this.authentificationLoaded
        options.headers.set("gitusername", await this.promisedUsername);
        options.headers.set("gitemail", await this.promisedEmail);
        options.headers.set("gitpassword", await this.promisedToken);
      } 

      // #Hack #Chrome 64 issue #D3
      var url = request.url.toString() 
      if (url.match(/^https:\/\/null:null@/)) {
        url = request.url.toString().replace(/^https:\/\/null:null@/,"https://")
      }
      var req = new Request(url, options );

      // use system here to prevent recursion...
      resolve(self.fetch(req).then((result) => {
        if (result instanceof Response) {
          return result;
        } else {
          return new Response(result);
        }
      }).catch(e => {
        console.error("fetch error: "  + e);
        return new Response("Could not fetch " + url +", because of: " + e);
      })) 
    });
  }
    
  
  fetchLively4url(request, event, pending, url) {
    try {
        // Prepare a function that performs the network request if necessary
        let doNetworkRequest = async () => {
          // If we are not navigating using the browser, inject header information
          if(request.mode !== 'navigate') {
            return this.fetchLively4authenticated(request) 
          } else {
            // If we are navigating in the browser, simply forward the request
            return self.fetch(request).catch(e => {
              console.error("fetch error: "  + e);
              return new Response("Could not fetch " + url +", because of: " + e);
            })
          }
        };

        if (pending) {
          pending.resolve(doNetworkRequest());
        } else {
          // Use the cache if possible
          event.respondWith(this._cache.fetch(event.request, doNetworkRequest));
        }
      } catch(err) {
        // TODO: improve the solution, matching errors by message should be done better
        if (err.toString().match("The fetch event has already been responded to.")) {
          console.error("How can we check for this before? ", err);
        } else {
          throw err;
        }
      }
  }
  
  fetchLively4fs(request, event, pending, url) {
    // Prepare a function that performs the network request if necessary
    let doNetworkRequest = () => {
      // Forward call to filesystem, which will then perform the network request
      return new Promise(async (resolve, reject) => {
        resolve(this.filesystem.handle(request.clone(), url).then((result) => {
          if (result instanceof Response) {
            return result;
          } else if (result && result.toResponse) {
            return result.toResponse();
          } else {
            return new Response(result);
          }
        }).catch((err) => {
          console.error('Error while processing fetch event:', err);

          let message = err.toString();
          let content = JSON.stringify({message: message});

          return new Response(content, {status: 500, statusText: message});
        }));
      });
    } 

    if (pending) {
      pending.resolve(doNetworkRequest());
    } else {
      event.respondWith(this._cache.fetch(event.request, doNetworkRequest));
    }
  }

  
  // #TODO What is this? 
  fetchPi(request, event, pending, url) {
    let doNetworkRequest = async () => {
      // request.clone
      return new Response("this shortcut is not implemented yet #TODO ");
    } 

    if (pending) {
      pending.resolve(doNetworkRequest());
    } else {
      event.respondWith(this._cache.fetch(event.request, doNetworkRequest));
    }
  }

  fetch(event, pending) {
    let request = event.request;
    if (!request) return;
    
    let  url = new URL(request.url);

    // console.log(lively4stamp(), "SWX.fetch " + request.method + " " + url + ", " + pending);
    // console.log(`fetch(${url})`);

    if (url.pathname.match(/\/_git\//)) return;
    if (url.pathname.match(/\/_search\//)) return; 
    if (url.pathname.match(/\/_meta\//)) return; 
    if (url.pathname.match(/lively4services/)) return; // seems to not work with SWX, req. are pending
    if (url.pathname.match(/lively4handwriting/)) return;

    // if (url.pathname.match(/noserviceworker/)) return; // #Debug

    if (url.hostname !== 'pi' && url.hostname !== 'lively4' && url.hostname == location.hostname/* && request.mode != 'navigate'*/) {
      this.fetchLively4url(request, event, pending, url)
    } else if (url.hostname === 'lively4') {
      this.fetchLively4fs(request, event, pending, url)
    } else if (url.hostname === 'pi') {
      this.fetchPi(request, event, pending, url)
    }
  }

  message(event) {
    return msg.process(event);
  }
}

/*
 * function to object adapter
 */

var __instance__
var __instancePromise__
export async function instance() {
  return __instance__;
}

export async function instancePromise() {
  if(typeof  __instancePromise__ === 'undefined') {
    __instancePromise__ = ServiceWorker.instance() // sets __instance__
  }
  return  __instancePromise__;
}

export function install() {
  return self.skipWaiting();
}

export function activate() {
  return self.clients.claim();
}

export function fetch(event) {
  return instancePromise().then((swx) => swx.fetch(event));
}

export function message(event) {
  return instancePromise().then((swx) => swx.message(event));
}

export {
  focalStorage
}

console.log("load swx");
// Force constructor
instancePromise(); 

