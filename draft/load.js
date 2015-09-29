

log("2**3="+ 2**3)

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('https://livelykernel.github.io/lively4-core/serviceworker-loader.js', {
        scope: "https://livelykernel.github.io/lively4-core/draft/"
    }).then(function(registration) {
        // Registration was successful
        log('ServiceWorker registration successful with scope: ', registration.scope);
        navigator.serviceWorker.ready.then(function() {
        	log('READY');
            System.import("file-editor.js").then(function(module) {
                window.fileEditor = module
                log("fileEditor loaded")
            })
            // #TODO continue here... loadFile is not in global scope (yet)
		});
    }).catch(function(err) {
        // registration failed
        log('ServiceWorker registration failed: ', err);
    });
}
