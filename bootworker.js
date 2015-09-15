'use strict';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker-loader.js', {
        scope: "http://localhost:8080/"
    }).then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        /*
        var activeWorker = registration.active;
        activeWorker.addEventListener('message', function(e) {
            console.log('# # # # ## # # # # # # # # # # # # # # #');
            console.log('GOT A MESSAGE FROM SW');
            console.log('# # # # ## # # # # # # # # # # # # # # #');
            console.log(e);

        });
        var channel = new MessageChannel();

        channel.port1.onmessage = function handleMessage(e) {
            console.log('## ## ## ## ## ## ## ## ## ## ## ##');
            console.log(e);
        };

        activeWorker.postMessage('U HEAR THIS?', [channel.port2]);
        window.sWorker = activeWorker;
        */
    }).catch(function(err) {
        // registration failed
        console.log('ServiceWorker registration failed: ', err);
    });
}
