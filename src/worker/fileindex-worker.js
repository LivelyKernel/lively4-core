
import FileIndex from "src/client/fileindex.js"

export function onmessage(evt) {
  var msg = evt.data
  if (msg.message == "updateDirectory") {
    FileIndex.current().updateDirectory(msg.url).then(() => {
      console.log("post message finished ")
      postMessage({message: "updateDirectoryFinished", url: msg.url})
    })
  } else if (msg.message == "updateFile") {
    FileIndex.current().updateFile(msg.url).then(() => {
      postMessage({message: "updateFileFinished", url: msg.url})
    })
  } else if (msg.message == "dropFile") {
    FileIndex.current().dropFile(msg.url).then(() => {
      postMessage({message: "dropFileFinished", url: msg.url})
    })
  } else {
    console.log("FileIndex message not understood", msg)
  }
}


