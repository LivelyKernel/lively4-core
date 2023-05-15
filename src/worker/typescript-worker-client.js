var a = 0

import SystemjsWorker from "src/worker/systemjs-worker.js"

var test = new SystemjsWorker("src/worker/typescript-worker.js")
test.onmessage = (result) => {
  lively.notify(result.data)
}
test.postMessage({urlString: 'src/worker/typescript-worker-client.js'})
