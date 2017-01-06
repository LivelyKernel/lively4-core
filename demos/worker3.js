/*
new Worker("demos/worker3.js");
*/
console.log('worker says hello')

// importScripts("../src/external/babel/babel.js")
// importScripts("../vendor/regenerator-runtime.js")

importScripts("../src/external/systemjs/system.js")

// SystemJS.config({ transpiler: './../src/external/babel/babel.js' })
SystemJS.config({
  meta: {
    "*.js": { 
      babelOptions: {
        stage0: true,
        stage1: true
      }
    }
  },
  map: {
    'plugin-babel': './../src/external/babel/plugin-babel.js',
    'systemjs-babel-build': './../src/external/babel/systemjs-babel-browser.js',
  },
  transpiler: 'plugin-babel' }
)

System.import("./mymod.js")
