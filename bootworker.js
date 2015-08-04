'use strict';

console.log('App: File Start');

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker.js', {
        scope: "http://localhost:8080/"
    }).then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(function(err) {
        // registration failed
        console.log('ServiceWorker registration failed: ', err);
    });
}

console.log('App: File End');
