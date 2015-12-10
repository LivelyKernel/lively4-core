
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
// if (!console.log.isWrapped) {
//     var nativeLog = console.log

//     console.log = function() {
//         nativeLog.apply(console, arguments)
//         log.apply(undefined, arguments)
//     }

//     console.log.isWrapped = true
// }


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

