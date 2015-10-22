
    function log(/* varargs */) {
        Array.prototype.forEach.call(arguments, function(s) {
           $('#console').text($('#console').text() + "\n" + s)
        })
        $('#console').scrollTop($('#console')[0].scrollHeight);
    }

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
    var root  = ("" + window.location).replace(/[^\/]*$/,'../')

    navigator.serviceWorker.register(root + 'serviceworker-loader.js', {
        scope: root + "draft/"
    }).then(function(registration) {
        // Registration was successful
        log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(function(err) {
        // registration failed
        log('ServiceWorker registration failed: ', err);
    });

    navigator.serviceWorker.ready.then(function(registration) {
            log('READY');
            System.import("file-editor.js").then(function(module) {
                window.fileEditor = module
                log("fileEditor loaded")
            })
            // #TODO continue here... loadFile is not in global scope (yet)
    })
}

document.addEventListener('DOMContentLoaded', function () {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
});

