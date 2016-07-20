importScripts('src/external/system.src.js', 'src/external/lunr.js');
importScripts('vendor/regenerator-runtime.js');
importScripts('vendor/babel-browser.js');
importScripts('vendor/es6-module-loader-dev.js');

msgId = undefined
options = undefined

System.transpiler = 'babel'
System.babelOptions = {stage: 0, optional: ['es7.doExpressions']}
System.import('./lunr-es6-search-worker.js').then( function (worker) {
  new worker.ES6SearchWorker(msgId, options);
});

// temporary messageHandler to catch init messages while System.import hasn't finished
// loading the actual SearchWorker
messageHandler = function (m) {
  m = m.data
  if (m.type == "init") {
    msgId = m.msgId;
    options = m.options;
  }
}

onmessage = this.messageHandler.bind(this);
