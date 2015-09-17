'use strict';

importScripts('src/sw/core.js');

importScripts('src/sw/messaging.js');

//importScripts('bundle.js');

importScripts('babel-core/browser.js');
importScripts('babel-core/browser-polyfill.js');

importScripts('serviceworker-cache-polyfill.js');

// --------------------------------------------------------------------
// Loaders
// --------------------------------------------------------------------

importScripts('src/sw/github-api.js');

importScripts('src/sw/transform.js');

console.log('Service Worker: File Start');

self.addEventListener('install', function(event) {
    console.log('Service Worker: Install');
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker: Activate');
    self.clients.claim();
});

importScripts('src/sw/fetch.js');

l4.fetchTask('babel src transform', applySourceTransformationMatch, function(event) {
    return l4.parseEvent(event)
        .then(l4.through(function(request) {
            console.log('#+#+##+#+#+++#+#+#+##+#+#+#+#+#+#+#+#+#+#+##++##+#+#+#+');
            console.log('src transform');
        }))
        .then(fetch)
        .then(transform(babelTransform));
});

(function() {
    var evaluator = {
        expression: /^(https:\/\/eval\/)/,

        transform: function(request) {
            console.log('Eval Loader', request.url);

            console.log('starting eval');
            var s = request.url.replace(evaluator.expression, '');

            try {
                console.log('eval try', s);
                var result = eval(s);
            } catch(e) {
                console.log('eval catch', s);
                result = "Error: " + e;
            }
            console.log('eval result', result);

            return new Response(result);
        }
    };

    l4.fetchTask('eval', l4.urlMatch(evaluator.expression), function(event) {
        return l4.parseEvent(event)
            .then(evaluator.transform);
    });
})();

/*
 TODO: broker/servicelocator for core modules
 https://github.com/mochajs/mocha/issues/1457
 make them interchangable
 var modules;

 var broker = function broker(name) {
 return (modules && modules[name]) || broker.defaults[name]();
 };

 broker.defaults = {
 runner: function() {
 return require('./lib/runner');
 },
 test: function() {
 return require('./lib/test') ;
 }
 };

 broker.init = function init(opts) {
 modules = opts;
 return broker;
 });

 module.exports = broker;

 then calling:
 require('broker').init(modules);
 require('broker')('runner');
 */

/*
 TODO: plugin architecture
 chai.use(require('some-chai-plugin'));
 mocha.use(require('plugin-module')(opts));

 thenable plugins
 l4.use().then();
 */

/*
TODO: configuration via code, not json as code is more powerful, e.g.
// karma.conf.js
module.exports = function(karma) {
  karma.set({
     browsers: [process.env.TRAVIS ? 'Firefox' : 'Chrome']
   });
 }

// angular
 'use strict';

 var angularFiles = require('./angularFiles');
 var sharedConfig = require('./karma-shared.conf');

 module.exports = function(config) {
 sharedConfig(config, {testName: 'AngularJS: jqLite', logFile: 'karma-jqlite.log'});

 config.set({
 files: angularFiles.mergeFilesFor('karma'),
 exclude: angularFiles.mergeFilesFor('karmaExclude'),

 junitReporter: {
 outputFile: 'test_out/jqlite.xml',
 suite: 'jqLite'
 }
 });
 };
 */

console.log('Service Worker: File End');

// --------------------------------------------------------------------
// Usage
// --------------------------------------------------------------------

(function() {
    var headers = new Headers();
    //headers.append();

    var request = new Request('https://code.jquery.com/jquery-2.1.4.js', {
        method: 'GET',
        headers: headers
    });

    fetch(request).then(function(response) {
        console.log('#############################################################');
        console.log(response);
    }).catch(function(error) {
        console.log('#############################################################');
        console.log(error);
    });
})();
