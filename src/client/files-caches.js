import Files from "./files.js"

if (!navigator.serviceWorker) {
  console.warn("[files]... could not register message handler with no-existing service worker")
} else {
  lively.removeEventListener("files", navigator.serviceWorker)
  lively.addEventListener("files", navigator.serviceWorker, "message", async (evt) => {
    try {
      if(evt.data.name == 'swx:cache:update') {
        var map = Files.cachedFileMap()
        console.log("[files] update " + evt.data.method + " "+ evt.data.url)
        
        if (evt.data.method == "PUT") {
          map.set(evt.data.url, {exists: true})
        }
        
        if (evt.data.method == "DELETE") {
          map.set(evt.data.url, {exists: false})
        }
        
      } 
    } catch(err) {
      console.error("[files] error during swx message handling...", err)
    }
  });
}
