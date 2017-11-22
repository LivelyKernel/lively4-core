/*
 *
 */

import * as fs from './filesystem.js'
import * as msg from './messaging.js'

import sysfs from './fs/sys.js'
import httpfs from './fs/http.js'
import html5fs from './fs/html5.js'
import githubfs from './fs/github.js'
import dropboxfs from './fs/dropbox.js'

import focalStorage from './external/focalStorage.js';

import { Cache } from './cache.js';

const storagePrefix = "LivelySync_";

class ServiceWorker {
  constructor() {
    this.filesystem = new fs.Filesystem();

    // default file system
    this.filesystem.mount('/', githubfs, {repo: 'LivelyKernel/Lively4', branch: 'master'}); // mounting lively4-core is to irritating
    this.filesystem.mount('/sys', sysfs, this);
    this.filesystem.mount('/local', html5fs);

    // here we should remount previous filesystem (remembered in focalStorage)
    
    // Create cache
    this._cache = new Cache(this.filesystem);
  }

  static instance() {
    var startTime = Date.now();
    var instance = new ServiceWorker();
    __instance__ = instance; // Global side effect #TODO

    return instance.filesystem.loadMounts().then( () => {
      console.log("mount FS in" + (Date.now() - startTime) + "ms");

      instance.resolvePendingRequests();
      return instance;
    })
  }

  resolvePendingRequests() {
    // DR: `pendingRequests` is defined during boot, but for later requests it did not exist, so the original check caused a ReferenceError
    if (typeof pendingRequests === 'undefined' || !pendingRequests) {
      console.log("no pending requests");
      return;
    }
    console.log("resolve pending requests: " + pendingRequests);
    // #Hack needed, because the swx-solved loads asyncronously and the service worker expects and syncronouse answer or promise. 
    pendingRequests.forEach(ea => {
      console.log("work on pendingRequest " + ea.url);
      this.fetch(ea.event, ea);
    });
    // stop listening to requests..
    pendingRequests = null; 
    
  }

  fetch(event, pending) {
    // console.log("SWX.fetch " + event + ", " + pending);
    let request = event.request;
    if (!request) return;

    let  url = new URL(request.url);
    let promise = undefined;
    
    //console.log(`fetch(${url})`);

    if (url.pathname.match(/\/_git\//)) return;
    if (url.pathname.match(/\/_search\//)) return; 
    if (url.pathname.match(/\/_meta\//)) return; 
    //if (url.pathname.match(/lively4-serviceworker/)) return; 
    if (url.pathname.match(/lively4services/)) return; // seems to not work with SWX, req. are pending
  
    // if (url.pathname.match(/noserviceworker/)) return; // #Debug
  
    if (url.hostname !== 'lively4' && url.hostname == location.hostname/* && request.mode != 'navigate'*/) {
      try {
        var p;
        if(request.mode !== 'navigate') {
          p = new Promise(async (resolve, reject) => {
            var email = await focalStorage.getItem(storagePrefix+ "githubEmail");
            var username = await focalStorage.getItem(storagePrefix+ "githubUsername"); 
            var token = await focalStorage.getItem(storagePrefix+ "githubToken");

             // we have to manually recreate a request, because you cannot modify the original
             // see http://stackoverflow.com/questions/35420980/how-to-alter-the-headers-of-a-request
             var options = {
                method: request.method,
                headers: new Headers(), 
                mode: request.mode,
                credentials: request.credentials,
                redirect: request.redirect 
            };
            if (request.method == "PUT") {
              options.body =  await request.blob();
            }

            for (var pair of request.headers.entries()) {
              options.headers.set(pair[0], pair[1]);
            }
            options.headers.set("gitusername", username);
            options.headers.set("gitemail", email);
            options.headers.set("gitpassword", token);

            var req = new Request(request.url, options );

            // use system here to prevent recursion...
            resolve(self.fetch(req).then((result) => {
              if (result instanceof Response) {
                return result;
              } else {
                return new Response(result);
              }
            }).catch(e => {
              console.log("fetch error: "  + e);
              return new Response("Could not fetch " + url +", because of: " + e);
            })) 
          });
        } else {
          p = new Promise(async (resolve, reject) => {
            resolve(self.fetch(request).then((result) => {
              return result;
            }).catch(e => {
              console.log("fetch error: "  + e);
              return new Response("Could not fetch " + url +", because of: " + e);
            }))
          });
        }

        if (pending) {
          pending.resolve(p);
        } else {
          // Use the cache if possible
          event.respondWith(this._cache.fetch(event.request, p));
        }
      } catch(err) {
        // TODO: improve the solution, matching errors by message should be done better
        if (err.toString().match("The fetch event has already been responded to.")) {
          console.log("How can we check for this before? ", err);
        } else {
          throw err;
        }
      }
    } else if (url.hostname === 'lively4') {
      // QUESTION: When opening a folder, lively sometimes sends a OPTION request to https://lively4/
      // This request is then handled here and forwarded to the github filesystem, which returns an error 405
      // (there is never any actual path, the request always goes to https://lively4/)
      // Why is this happening? Is this still necessary?
      var p = new Promise(async (resolve, reject) => {
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

      if (pending) {
        console.log("resolve pending request: " + pending.url)
        pending.resolve(p);
      } else
        event.respondWith(this._cache.fetch(event.request, p));
    }
  }

  message(event) {
    return msg.process(event);
  }
  
  prepareOfflineBoot() {
    console.log('Preparing offline boot');
    
    // Cache all files which are necessary to boot lively in the browser cache
    let filesToLoad = [
      '',
      'start.html',
      'swx-boot.js',
      'swx-loader.js',
      'swx-post.js',
      'swx-pre.js',
      'src/client/boot.js'
    ];

    let directoryParts = self.location.pathname.split('/');
    directoryParts[directoryParts.length-1] = '';
    let directory = directoryParts.join('/');
    
    filesToLoad = filesToLoad.map((file) => {return directory + file});

    for(let file of filesToLoad) {
      let request = new Request(file, {
        method: 'GET' 
      });
      
      var p = new Promise(async (resolve, reject) => {
        resolve(self.fetch(request).then((result) => {
          return result;
        }).catch(e => {
          console.log("fetch error: "  + e);
          return new Response("Could not fetch " + url +", because of: " + e);
        }))
      });
      
      this._cache.fetch(request, p);
    }
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
  instancePromise().then((swx) => { swx.prepareOfflineBoot() });
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

