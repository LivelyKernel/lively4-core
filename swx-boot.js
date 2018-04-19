
console.log("hello again!")

self.lively4url = self.location.toString().replace(/\/[^/]*$/,"")

importScripts("./src/external/systemjs/system.src.js");

self.lively4swx = new URL('./src/external/lively4-serviceworker/src/', self.location.href).toString()

const moduleOptionsNon = {
      babelOptions: {
        es2015: false,
        stage2: false,
        stage3: false,
        plugins: []
      }
    };

SystemJS.config({
  
  baseURL: lively4url + '/', // needed for global refs like "src/client/lively.js", we have to refactor those before disabling this here. #TODO #Discussion
  meta: {
     '*.js': moduleOptionsNon
  },
  "*.js": { 
    // babelOptions: {
    //   stage0: true,
    //   stage1: true
    // }
    babelOptions: {
      es2015: false,
      stage2: false,
      stage3: false,
      plugins: []
    }
  },
  map: {
        // #Discussion have to use absolute paths here, because it is not clear what the baseURL is
        'plugin-babel': lively4url + '/src/external/babel/plugin-babel2.js',
        'systemjs-plugin-babel': lively4url + '/src/external/babel/plugin-babel.js',
        'systemjs-babel-build': lively4url + '/src/external/babel/systemjs-babel-browser.js',
    
  },
  trace: true,
  transpiler: 'plugin-babel' }
)

var originalFetch = fetch;

function isOnline() {
  if((location.origin + "").match(/localhost/)) return true;
  
  const checkUrl = `${location.origin}/?checkOnline=${+ new Date()}`;
    
    // Try to reach the server
    let request = new Request(checkUrl, {
      method: 'HEAD',
    });

    return originalFetch(request)
      .then(() => {
        // We are really online
        return true;
      })
      .catch(() => {
        // Request was unsuccessful, so we are most likely offline
        return false;
      });
}

var initPending = true;
fetch = function(request, ...args) {
  // Ensure request is of type Request and not only a string URL
  request = new Request(request);
  
  if (initPending) {  
    return new Promise(async (resolve, reject) => {
      
      // #TODO: window is not defined here so checking for window.caches throws an error
      let cache = await caches.open("lively4-swx-cache");
      
      if (navigator.onLine && await isOnline()) {
        let response = await originalFetch(request, ...args);
        
        // var clone =  response.clone()
        try {
          cache.put(request, response.clone());
        } catch(e) {
          // #TODO #FUCK  the cache.put seems to evaluatute the javascript and hickups on "import *" etc.. Why?
          console.error("fetch error " + e)
        }
        
        
        resolve(response);
        return;
      }
      
      let response = await cache.match(request);
      
      if (response) {
        resolve(response);
      } else {
        console.log("not in cache")
        resolve(originalFetch(originalFetch(request, ...args)))
      }
    });
  } else {
    return originalFetch(request, ...args);
  }  
}

function init() {
  let promise = System.import(lively4swx + "swx.js");
  promise.then(() => initPending = false);
  return promise;
}
console.log("Base system loaded after  " + (Date.now() - startSwxTime) + "ms")

init().then(worker => {
  console.log("SWX loaded after  " + (Date.now() - startSwxTime) + "ms")
})

this.addEventListener('install', (event) => {
  event.waitUntil(
    init()
      .then(worker => worker.install(event))
      .catch(error => { console.error(error); throw error })
  )
})

this.addEventListener('activate', (event) => {
  event.waitUntil(
    init()
      .then(worker => worker.activate(event))
      .catch(error => { console.error(error); throw error })
  )
})

this.addEventListener('fetch', (event) => {
  if (pendingRequests) return;
  
  // console.log("fetch swx-boot.js " + event.request.url)

//   var pending = {}
// 	event.respondWith(new Promise(resolve => {
//     pending.resolve = resolve;
//   }));
  
  event.waitUntil(
    init()
      .then(worker => worker.fetch(event))
      .catch(error => { console.error(error); throw error })
  )
})

this.addEventListener('message', (event) => {
  if(event.data === 'kernel:sw-force-reload') {
    loader = undefined
  }

  event.waitUntil(
    init()
      .then(worker => worker.message(event))
      .catch(error => { console.error(error); throw error })
  )
})
