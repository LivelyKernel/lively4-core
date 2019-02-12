

import FileIndexAnalysis from "src/client/fileindex-analysis.js"
import FileCache from "src/client/fileindex.js"

export function onmessage(evt) {
  var msg = evt.data
  if (msg.message == "updateDirectory") {
    FileCache.current().updateDirectory(msg.url).then(() => {
      postMessage({message: "updateDirectoryFinished", url: msg.url})
    })
    FileIndexAnalysis.current().updateDirectory(msg.url).then(() => {
      postMessage({message: "FileIndexAnalysis - updateDirectoryFinished", url: msg.url})
    })
  } else if (msg.message == "updateFile") {
    FileCache.current().updateFile(msg.url).then(() => {
      postMessage({message: "updateFileFinished", url: msg.url})
    })
     FileIndexAnalysis.current().updateFile(msg.url).then(() => {
      postMessage({message: "FileIndexAnalysis - updateFileFinished", url: msg.url})
    })
  } else {
    console.log("FileIndex message not understood", msg)
  }

}


