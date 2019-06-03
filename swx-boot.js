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
  return originalFetch(request, ...args);
}

console.log("Base system loaded after  " + (Date.now() - startSwxTime) + "ms")

console.log('REGISTER self', self, " this", this)

self.addEventListener('install', (event) => {
  console.log("SWX installed after  " + (Date.now() - startSwxTime) + "ms (no importScript beyond this point)")
  
  event.waitUntil(
    init()
      .then(worker => worker.install(event))
      .catch(error => { console.error(error); throw error })
  )
})

this.addEventListener('activate', (event) => {
  console.log("SWX activated after  " + (Date.now() - startSwxTime) + "ms")
  event.waitUntil(
    init()
      .then(worker => worker.activate(event))
      .catch(error => { console.error(error); throw error })
  )
})

function init() {
  let promise = System.import(lively4swx + "swx.js");
  promise.then(() => initPending = false);
  return promise;
}

init().then(worker => {
  console.log("SWX loaded after  " + (Date.now() - startSwxTime) + "ms")
})


this.addEventListener('fetch', (event) => {
  // console.log("fetch event " + event.request.url)

  if (pendingRequests) {
    // we are still in booting phase and capture requests in pendingRequests; pendingRequests will be set to null in swx once we are done booting
    var url = event.request.url;

    // console.log("fetch event ADD PENGING " + event.request.url)
    var promise = new Promise((resolve, reject) => {
      pendingRequests.push({
      event: event,
      url: url,
      resolve: resolve,
      reject: reject
       });
    });
    event.respondWith(promise);
    return;
  }

  // normal request handling
  // #TODO: get rid of unnecessary waiting for modules
  // #TODO: would `event.respondWith(Promise<Response>)` work? -> Needs swx refactoring so that swx-worker returns a Promise #Refactor
  event.waitUntil(
    init()
      .then(worker => worker.fetch(event))
      .catch(error => { console.error(error); throw error })
  );
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
