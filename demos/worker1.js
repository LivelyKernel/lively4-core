/*
new Worker("demos/worker1.js");
*/
console.log('worker says hello')

importScripts("../src/external/babel/babel.js")
importScripts("../src/external/systemjs/system.js")

// SystemJS.config({ transpiler: './../src/external/babel/babel.js' })
SystemJS.config({
  map: {
    'babel': './../src/external/babel/babel.js',
  },
  transpiler: 'babel' }
)

System.import("./mymod.js")

// debugger


/*
Uncaught (in promise) Error: Unable to dynamically transpile ES module
   A loader plugin needs to be configured via `SystemJS.config({ transpiler: 'transpiler-module' })`.
  Instantiating https://lively4/src/external/lively4-serviceworker/src/fs/dropbox.js
  Loading https://lively4/src/external/lively4-serviceworker/src/fs/dropbox.js
    at Ye (system.js:5)
    at system.js:5
*/

// System.import("https://lively4/src/external/lively4-serviceworker/src/fs/dropbox.js").then( m => {
//   debugger
// })