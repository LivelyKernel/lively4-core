


import FileCache from "src/client/filecache.js"

export function onmessage(evt) {
  var msg = evt.data
  if (msg.message == "updateDirectory") {
    FileCache.current().updateDirectory(msg.url).then(() => {
      postMessage({message: "updateDirectoryFinished"})
    })
  } else {
    console.log("FileCache message not understood", msg)
  }

}


