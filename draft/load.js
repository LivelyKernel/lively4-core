
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('https://livelykernel.github.io/lively4-core/serviceworker-loader.js', {
        scope: "https://livelykernel.github.io/lively4-core/draft/"
    }).then(function(registration) {
        // Registration was successful
        alert('ServiceWorker registration successful with scope: ', registration.scope);
        navigator.serviceWorker.ready.then(function() {
        	alert('READY');
            System.import("file-editor.js")
            // #TODO continue here... loadFile is not in global scope (yet)
		});
    }).catch(function(err) {
        // registration failed
        alert('ServiceWorker registration failed: ', err);
    });
}
