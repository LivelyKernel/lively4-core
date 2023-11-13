import SystemjsWorker from "src/worker/systemjs-worker.js"

var myworker = new SystemjsWorker(lively4url + "/demos/worker/sum-systemjs-worker.js")

myworker.onmessage = function(evt) {
  lively.notify("sum = " + evt.data)
}

myworker.postMessage([3, 4]);
