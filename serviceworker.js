'use strict';

importScripts('serviceworker-cache-polyfill.js');
//importScripts('babel-core/browser.js');
//importScripts('es6-module-loader/es6-module-loader-dev.src.js');
//
//importScripts('babelsberg/standalone/prototype.js');
//importScripts('babelsberg/standalone/minilively.js');
//
//    <!-- // cop.Layers -->
//importScripts('babelsberg/cop/Layers.js');
//
//    <!-- // ometa.lively -->
//importScripts('babelsberg/ometa/lib.js');
//importScripts('babelsberg/ometa/ometa-base.js');
//importScripts('babelsberg/ometa/parser.js');
//importScripts('babelsberg/ometa/ChunkParser.js');
//importScripts('babelsberg/ometa/bs-ometa-compiler.js');
//importScripts('babelsberg/ometa/bs-js-compiler.js');
//importScripts('babelsberg/ometa/bs-ometa-js-compiler.js');
//importScripts('babelsberg/ometa/bs-ometa-optimizer.js');
//importScripts('babelsberg/ometa/lk-parser-extensions.js');
//    <!-- // lively.Ometa -->
//importScripts('babelsberg/ometa/Ometa.js');
//    <!-- // lively.Interpreter -->
//importScripts('babelsberg/jsinterpreter/generated/Nodes.js');
//importScripts('babelsberg/jsinterpreter/generated/Translator.js');
//importScripts('babelsberg/jsinterpreter/LivelyJSParser.js');
//importScripts('babelsberg/jsinterpreter/Parser.js');
//importScripts('babelsberg/jsinterpreter/Meta.js');
//importScripts('babelsberg/jsinterpreter/Rewriting.js');
//importScripts('babelsberg/jsinterpreter/Interpreter.js');
//    <!-- // Babelsberg/js -->
//importScripts('babelsberg/babelsberg/core_ext.js');
//importScripts('babelsberg/babelsberg/constraintinterpreter.js');
//importScripts('babelsberg/standalone/test_harness.js');
//    <!-- // src transform -->
//importScripts('babelsberg/babelsberg/uglify.js');
//importScripts('babelsberg/babelsberg/src_transform.js');

console.log('Service Worker: File Start');

self.addEventListener('install', function(event) {
    console.log('Service Worker: Install');
});

self.addEventListener('fetch', function(event) {
    console.log('Service Worker: Fetch', event.request, event.request.url);

    var response = parseEvent(event)
        .then(applyLoaders)
        .then(applyTransformers);

    event.respondWith(response);
});

function parseEvent(event) {
    // TODO: rename push
    return new Promise(function(resolve, reject) {
        resolve(event.request);
    });
}

function applyLoaders(request) {
    console.log('Service Worker: Loader', request.url);
    var evalRegex = /^(https:\/\/eval\/)/;

    var response;

    if(request.url.match(evalRegex)) {
        console.log('starting eval');
        var s = request.url.replace(evalRegex, '');
        console.log('eval', s);
        try {
            console.log('eval try', s);
            var result = eval(s);
        } catch(e) {
            console.log('eval catch', s);
            result = "Error: " + e;
        }
        console.log('eval result', result);
        response = new Response(s + " is " + result);
    } else {
        response = fetch(request).then(applyTransformers);
    }

    return response;
}

function applyTransformers(response) {
    console.log('Service Worker: Transformer', response, response.url);

    if (!response.url.endsWith('.js')) {
        return response;
    }

    console.log('Start Transform');

    console.log('For Transformation');
//    var clone = response.clone();
//    var clone2 = clone.clone();
//    var transformPromise = clone.text().then(function(txt) {
        //console.log('TRANSFORM', txt);
//        return new Response(txt + '\n console.log("FOOOOOOOOOOOOO");');
//    }).catch(function(error) {
//        console.log('ERROR DURING TRANBSFORM', error);
//        return response;
//    });

    //var srcTransform = new BabelsbergSrcTransform();
    //var src = srcTransform.transform(callback.toString());

    console.log('End Transform');

    return response;
}

console.log('Service Worker: File End');
