'use strict';

importScripts('serviceworker-cache-polyfill.js');

console.log('Service Worker: File Start');

self.addEventListener('install', function(event) {
    console.log('Service Worker: Install');
});

self.addEventListener('fetch', function(event) {
    console.log('Service Worker: Fetch', event.request, event.request.url);
    console.log('matching', event.request.url.match("https://eval/"))
    var respond;

    if (event.request.url.match("https://eval/")) {
        var s = event.request.url.replace("https://eval/","");
        console.log('eval', s);
        try {
            console.log('eval try', s);
            var result = eval(s);
        } catch(e) {
            console.log('eval catch', s);
            result = "Error: " + e
        }
        console.log('eval result', result);
        respond = new Response(s + " is " + result);
    }  else {
        respond = fetch(event.request).then(
            function(response) {
                console.log('Service Worker: Response', response, response.url);
                return response;
            }
        );
    }

    event.respondWith(respond);
});

console.log('Service Worker: File End');
