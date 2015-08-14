'use strict';

var broadCastMessage = function(data) {
    self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
            client.postMessage({
                msg: 'log',
                data: data
            });
        });
    });
};

broadCastMessage('HELLO CLIENT');
broadCastMessage('U HEAR ME');

//importScripts('bundle.js');

importScripts('babel-core/browser.js');
importScripts('babel-core/browser-polyfill.js');

importScripts('serviceworker-cache-polyfill.js');

// Loaders
importScripts('loader/default.js');
importScripts('loader/eval.js');

// Transformers
importScripts('transformer/identity.js');

'use strict';

class LogAppend {
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
                            modules: 'system'
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

self.addEventListener('fetch', function(event) {
    console.log('Service Worker: Fetch', event.request, event.request.url);
    broadCastMessage('FETCHING THIS STUFF: ' + event.request.url);

    var response = parseEvent(event)
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

    var log = new LogAppend();
    if(log.match(response)) {
        return log.transform(response);
    }

    return (new Identity()).transform(response);
}

console.log('Service Worker: File End');
