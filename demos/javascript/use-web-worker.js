var myWorker = new Worker(lively4url + '/demos/webworker.js');

myWorker.onmessage = function(e) {
  lively.notify( e.data);
  console.log('Message received from worker');
}

myWorker.postMessage(["foo", "bar"]);