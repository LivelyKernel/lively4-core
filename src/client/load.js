/* Load Lively */

function log(/* varargs */) {
    var args = arguments
    $('lively-console').each(function() { this.log.apply(this, args)})
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


var loadCallbacks = []
export function whenLoaded(cb) {
    loadCallbacks.push(cb)
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
        // Lively has all the dependencies
        System.import("../src/client/lively.js").then(function(lively) {
            window.lively = lively
            initializeHalos();
            lively.components.loadUnresolved();  
            console.log("running on load callbacks:");
            loadCallbacks.forEach(function(cb){ 
                try { 
                   cb()
                } catch(e) {
                    console.log("Error running on load callback: "  + cb + " error: " + e)
                }
            });
            console.log("lively loaded");
        })
    })

    var fs = new Promise(function(resolve, reject) {
        navigator.webkitPersistentStorage.requestQuota(1024 * 1024 * 10, function(grantedQuota) {
            self.webkitRequestFileSystem(PERSISTENT, grantedQuota, resolve, reject)
        }, reject)
    })

    navigator.serviceWorker.addEventListener("message", (event) => {
        var reject = function(err) {
            event.ports[0].postMessage({error: err})
        }

        switch(event.data.name) {
            case 'swx:readFile':
                fs.then((fs) => {
                    fs.root.getFile(event.data.file, undefined, function(fileEntry) {
                        fileEntry.file(function(file) {
                            var reader = new FileReader()

                            reader.onloadend = function(e) {
                                console.log('[LFS] read complete', e)
                                event.ports[0].postMessage({content: reader.result})
                            }

                            reader.readAsText(file)
                        })
                    }, reject)
                }).catch(reject)

                break
            case 'swx:writeFile':
                fs.then((fs) => {
                    fs.root.getFile(event.data.file, {create: true, exclusive: false}, function(file) {
                        file.createWriter(function (writer) {
                            writer.onwriteend = function(e) {
                                console.log("[LFS] write complete", e)

                                event.ports[0].postMessage({
                                    content: event.data.content
                                })
                            }

                            writer.onerror = reject
                            writer.write(new Blob([event.data.content], {type: 'text/plain'}))
                        }, reject)
                    }, reject)
                }).catch(reject)

                break
        }
    })
}

document.addEventListener('DOMContentLoaded', function () {
    if (Notification.permission !== "granted")
        Notification.requestPermission();


});


window.onbeforeunload = function(e) {
  return 'Do you really want to leave this page?';
};
// disable backspace navigation
    /*document.body.addEventListener("keydown", (evt) => {
        if (evt.keyCode == 8) { // backspace
            console.log("prevent  backspace navigation:")
            // #TODO refactor this into a general lively error logging / notifications?
            var n = new Notification("WARNING:", {body: "prevent  backspace navigation",});
            setTimeout(n.close.bind(n), 3000);
            evt.preventDefault();
        }
    });*/

function initializeHalos() {
    if ($('lively-halos').size() == 0) {
        $('<lively-halos>')
            .attr('data-lively4-donotpersist', 'all')
            .appendTo($('body'));
    }
}