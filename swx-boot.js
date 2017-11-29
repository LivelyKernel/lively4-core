
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

function init() {
  return System.import(lively4swx + "swx.js")
}
console.log("Base system loaded after  " + (Date.now() - startSwxTime) + "ms")

init().then(() => {
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
