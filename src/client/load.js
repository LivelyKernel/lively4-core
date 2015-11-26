
    function log(/* varargs */) {
        var c = $('#console')
        if (c.length == 0)  return 

        Array.prototype.forEach.call(arguments, function(s) {
           c.text(c.text() + "\n" + s)
        })
        c.scrollTop(c[0].scrollHeight);
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

    navigator.serviceWorker.register(root + 'serviceworker-loader.js', {
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

            // #TODO continue here... loadFile is not in global scope (yet)
            System.import("../src/client/script-manager.js").then(function(module) {
                window.scriptManager = module;
                log("scriptManager loaded");
            });
            System.import("../src/client/persistence.js").then(function(module) {
                window.persistence = module;
                log("persistence loaded");
            });
    })
}

document.addEventListener('DOMContentLoaded', function () {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
});

