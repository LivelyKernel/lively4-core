
    function log(/* varargs */) {
        Array.prototype.forEach.call(arguments, function(s) {
           $('#console').text($('#console').text() + "\n" + s)
        })
        $('#console').scrollTop($('#console')[0].scrollHeight);
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

    var fs = new Promise(function(resolve, reject) {
        navigator.webkitPersistentStorage.requestQuota(1024 * 1024 * 10, function(grantedQuota) {
            self.webkitRequestFileSystem(PERSISTENT, grantedQuota, resolve, reject)
        }, reject)
    })

    navigator.serviceWorker.addEventListener("message", (event) => {
        var reject = function(err) {
            console.log('RPC client error', err)
            event.ports[0].postMessage({error: err})
        }

        console.log('Client RPC received', event.data);

        switch(event.data.name) {
            case 'swx:requestQuota':
                console.log("Service worker requested file system quota", event.data);
                var requestedQuota = event.data.requestedQuota || 1024 * 1024 * 10

                navigator.webkitPersistentStorage.requestQuota(requestedQuota, function(grantedQuota) {
                    event.ports[0].postMessage({grantedQuota: grantedQuota})
                }, reject)

                break
            case 'swx:readFile':
                fs.then((fs) => {
                    debugger
                    fs.root.getFile(event.data.file, function(file) {
                        var reader = new FileReader()

                        reader.onloadend = function(e) {
                            console.log('Read complete', e)

                            event.ports[0].postMessage({content: this.result})
                        }

                        reader.readAsText(file)
                    }, reject)
                }).catch(reject)

                break
            case 'swx:writeFile':
                fs.then((fs) => {
                    fs.root.getFile(event.data.file, {create: true, exclusive: false}, function(file) {
                        file.createWriter(function (writer) {
                            writer.onwriteend = function(e) {
                                console.log("Write complete", e)

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

