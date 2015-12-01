
    function log(/* varargs */) {
        Array.prototype.forEach.call(arguments, function(s) {
           $('#console').text($('#console').text() + "\n" + s)
        })
        $('#console').scrollTop($('#console')[0].scrollHeight);
    }

// console.log("A squared: " + 2**4)

// guard againsst wrapping twice and ending in endless recursion
if (!console.log.isWrapped) {
    var nativeLog = console.log

    console.log = function() {
        nativeLog.apply(console, arguments)
        log.apply(undefined, arguments)
    }

    console.log.isWrapped = true
}


if ('serviceWorker' in navigator) {
    var root = ("" + window.location).replace(/[^\/]*$/,'../')

    navigator.serviceWorker.register(root + 'swx-loader.js', {
    // navigator.serviceWorker.register('../../serviceworker-loader.js', {
        // scope: root + "draft/"
        scope: root
    }).then(function(registration) {
        // Registration was successful
        log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(function(err) {
        // registration failed
        log('ServiceWorker registration failed: ', err);
    });

    navigator.serviceWorker.ready.then(function(registration) {
            log('READY');
            System.import("../src/client/file-editor.js").then(function(module) {
                window.fileEditor = module
                log("fileEditor loaded")
            })
            // #TODO continue here... loadFile is not in global scope (yet)
            System.import("../src/client/script-manager.js").then(function(module) {
                window.scriptManager = module;
                log("scriptManager loaded");
            });
    })

    navigator.serviceWorker.addEventListener("message", (event) => {
        if(event.data.name === 'swx:requestQuota') {
            console.log("Service worker requested file system quota", event.data);

            var requestedQuota = event.data.requestedQuota || 1024 * 1024 * 10

            navigator.webkitPersistentStorage.requestQuota(requestedQuota, function(grantedQuota) {
                event.ports[0].postMessage({grantedQuota: grantedQuota})
            }, function(err) {
                event.ports[0].postMessage({error: err})
            })
        }
    })
}

document.addEventListener('DOMContentLoaded', function () {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
});

