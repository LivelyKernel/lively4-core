
importScripts("./src/external/systemjs/system.js");

self.lively4swx = new URL('./src/external/lively4-serviceworker/src/', self.location.href).toString()

SystemJS.config({
  meta: {
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
    }
  },
  map: {
    'plugin-babel': './src/external/babel/plugin-babel.js',
    'systemjs-babel-build': './src/external/babel/systemjs-babel-browser.js',
  },
  transpiler: 'plugin-babel' }
)

function init() {
  return System.import(lively4swx + "./swx.js?1")
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
  // console.log("fetch swx-boot.js " + event.request.url)
  // event.waitUntil(
    init()
      .then(worker => worker.fetch(event))
      .catch(error => { console.error(error); throw error })
  // )
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
