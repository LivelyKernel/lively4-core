
    function log(s) {
        Array.prototype.forEach.call(arguments, function(s) {
           $('#console').text($('#console').text() + "\n" + s)
        })
        $('#console').scrollTop($('#console')[0].scrollHeight);
    }

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('https://livelykernel.github.io/lively4-core/serviceworker-loader.js', {
        scope: "https://livelykernel.github.io/lively4-core/draft/"
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
