// nothging


reloadServiceWorker = function reloadServiceWorker(x) {
    console.log("reload service worker")
	importScripts('https://livelykernel.github.io/lively4-core/serviceworker.js?' + Date.now());
};

