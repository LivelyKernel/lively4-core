'use strict';

self.l4 = {};

importScripts('src/sw/messaging.js');

//importScripts('bundle.js');

importScripts('babel-core/browser.js');
importScripts('babel-core/browser-polyfill.js');

importScripts('serviceworker-cache-polyfill.js');

// --------------------------------------------------------------------
// Loaders
// --------------------------------------------------------------------
importScripts('loader/default.js');
importScripts('loader/eval.js');

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

importScripts('src/sw/github-api.js');

// --------------------------------------------------------------------
// Transformers
// --------------------------------------------------------------------
importScripts('transformer/identity.js');

class ApplySourceTransformation {
    match(response) {
        var blackList = [
            'babel-core/browser.js',
            'es6-module-loader/es6-module-loader-dev.src.js',
            'bootworker.js',
            'serviceworker.js',
            'system-polyfills.src.js',
            'system.src.js',
            'serviceworker-loader.js'
        ];

        var isJS = response.url.indexOf('.js') > -1;
        var inBlackList = false;
        for(var i = 0; i < blackList.length; i++) {
            inBlackList = inBlackList || response.url.indexOf(blackList[i]) > -1;
        }
        return isJS && !inBlackList;
    }

    transform(response) {
        return response.clone().blob()
            .then(function(blob) {
                function readBlob(blob) {
                    console.log('Read blob of type ' + blob.type);
                    return new Promise(function(resolve, reject) {
                        var reader = new FileReader();

                        reader.addEventListener("load", function() {
                            resolve(reader.result);
                        });
                        reader.addEventListener("error", function(err) {
                            reject(err, 'Error during reading Blob');
                        });

                        reader.readAsBinaryString(blob);
                    });
                }

                return readBlob(blob)
                    .then(function srcTransform(content) {
                        console.log("BEFORE TRANSFORM");
                        //console.log(content);
                        console.log("AFTER TRANSFORM");
                        var transformed = babel.transform(content, {
                            //modules: 'system'
                        }).code;
                        //console.log(transformed);

                        return transformed;
                    })
                    .then(function packNewBlob(newContent) {
                        return new Blob([newContent], {
                            type: blob.type
                        });
                    });
            })
            .then(function packNewResponse(newBlob) {
                // pack new Response from a Blob and the given Response
                return new Response(newBlob, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            });
    }
}

console.log('Service Worker: File Start');

self.addEventListener('install', function(event) {
    console.log('Service Worker: Install');
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker: Activate');
    self.clients.claim();
});

function useGithub(event) {
    function getDataObject(url) {
        var obj = {};
        url.split('?')[1]
            .split('&')
            .forEach(function(datum) {
                var keyValue = datum.split('=');
                obj[keyValue[0]] = keyValue[1];
            });
        return obj;
    }

    // TODO: process request and call appropriate github functionality
    // Or use communication between Broswer and Worker to make this work
    console.log(' # # # # # # # ## # # # # # # #');
    console.log(event.request);
    return fetch(event.request);
}

self.addEventListener('fetch', function(event) {
    console.log('Service Worker: Fetch', event.request, event.request.url);
    l4.broadCastMessage('FETCHING THIS STUFF2: ' + event.request.url);

    var response = event.request.url.match(/^(https:\/\/githubapi\/)/) ?
        useGithub(event) :
        parseEvent(event)
            .then(applyLoaders)
            .then(applyTransformers);

    event.respondWith(response);
});


function parseEvent(event) {
    console.log(event.request.url);
    return new Promise(function(resolve, reject) {
        resolve(event.request);
    });
}

function applyLoaders(request) {
    console.log('Service Worker: Loader', request.url);

    var response;

    /*
    if(githubLoader.match(request)) {
        response = githubLoader.transform(request);
        return response;
    }
    */

    var evalScript = new EvalLoader();
    if(evalScript.match(request)) {
        response = evalScript.transform(request);
    } else {
        response = (new DefaultLoader()).transform(request);
    }

    return response;
}

function applyTransformers(response) {
    console.log('Service Worker: Transformer', response, response.url);

    var log = new ApplySourceTransformation();
    if(log.match(response)) {
        return log.transform(response);
    }

    return (new Identity()).transform(response);
}


/*
 TODO: broker/service locator for core modules
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

/*
 // TODO: gulp-like stream processing of requests
l4.task('github*', str => {
    l4.start(str)
        .then(loader(l4-github.request))
        .then(transform(l4_babel))
        .then(transform(l4_bbb))
        .then(l4_write())
});
*/

console.log('Service Worker: File End');
