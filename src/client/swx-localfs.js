// #DEPRECATED

var fs = new Promise(function(resolve, reject) {
  navigator.webkitPersistentStorage.requestQuota(1024 * 1024 * 10, function(grantedQuota) {
    self.webkitRequestFileSystem(PERSISTENT, grantedQuota, resolve, reject);
  }, reject);
});



if ('serviceWorker' in navigator) {

    navigator.serviceWorker.addEventListener("message", (event) => {
      var reject = function(err) {
        event.ports[0].postMessage({ error: err });
      };

      // support for service worker local filesytem
      switch (event.data.name) {
        case 'swx:readFile':
          fs.then((fs) => {
            fs.root.getFile(event.data.file, undefined, function(fileEntry) {
              fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onloadend = function(e) {
                  console.log('[LFS] read complete', e);
                  event.ports[0].postMessage({ content: reader.result });
                };
                reader.readAsText(file);
              });
            }, reject);
          }).catch(reject);
          break
        case 'swx:writeFile':
          fs.then((fs) => {
            fs.root.getFile(event.data.file, { create: true, exclusive: false }, function(file) {
              file.createWriter(function(writer) {
                writer.onwriteend = function(e) {
                  console.log("[LFS] write complete", e);
                  event.ports[0].postMessage({
                    content: event.data.content
                  });
                };
                writer.onerror = reject;
                writer.write(new Blob([event.data.content], { type: 'text/plain' }));
              }, reject);
            }, reject);
          }).catch(reject);
          break
      }
    });
  }