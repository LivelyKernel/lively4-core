'use strict';

importScripts('babel-core/browser.js');
importScripts('babel-core/browser-polyfill.js');

importScripts('serviceworker-cache-polyfill.js');

// Loaders
importScripts('loader/default.js');
importScripts('loader/eval.js');

// Transformers
importScripts('transformer/identity.js');
importScripts('transformer/logappend.js');

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

    var response = parseEvent(event)
        .then(applyLoaders)
        .then(applyTransformers);

    event.respondWith(response);
});

function parseEvent(event) {
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
