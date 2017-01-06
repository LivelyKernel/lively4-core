
/*
new Worker("demos/woker_swx.js");
*/

importScripts("../src/external/systemjs/system.js");

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


System.import("./../src/external/lively4-serviceworker/src/swx.js").then( m => {
    console.log("swx: ",  m)
})