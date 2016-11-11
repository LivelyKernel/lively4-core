var Builder = require('systemjs-builder');

var builder = new Builder('../');
builder.config({
  map: {
    'plugin-babel': '../plugin-babel.js',
    'systemjs-babel-build': './systemjs-babel-node.js'
  },
  transpiler: 'plugin-babel'
})

builder.buildStatic('build-babel/test.js', 'test-bundle.js', {
  format: 'cjs'
})
.then(function() {
  console.log('build completed');
});