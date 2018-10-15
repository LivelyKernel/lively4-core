
importScripts("./livelyworker.js")

onmessage = function(evt) {
  if (evt.data.message == "load")  {
    console.log("meta worker load "  + evt.data.url)
    System.import(evt.data.url).then((m) => {
      postMessage({message: "loaded"})
      self.onmessage = m.onmessage
    }).catch((err) => {
      console.log("meta worker error ", err)
      postMessage({message: "error", value: err})
    })
  }
}


