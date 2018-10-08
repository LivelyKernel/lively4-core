


import FileCache from "src/client/fileindex.js"

export function onmessage(evt) {
  var msg = evt.data
  if (msg.message == "updateDirectory") {
    FileCache.current().updateDirectory(msg.url).then(() => {
      postMessage({message: "updateDirectoryFinished"})
    })
  } else {
    console.log("FileIndex message not understood", msg)
  }

}


