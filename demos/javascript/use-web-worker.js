var myWorker = new Worker(lively4url + '/demos/javascript/webworker.js');

myWorker.onmessage = function(e) {
  lively.notify( e.data);
  console.log('Message received from worker');
}

myWorker.postMessage(["foo", "bar"]);