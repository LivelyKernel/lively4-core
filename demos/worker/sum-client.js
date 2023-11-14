
var myworker = new Worker(lively4url + "/demos/worker/sum-worker.js")

myworker.onmessage = function(evt) {
  lively.notify("sum = " + evt.data)
}

myworker.postMessage([3, 4]);