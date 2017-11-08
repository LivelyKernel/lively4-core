var myWorker = new Worker('./webworker.js');

myWorker.onmessage = function(e) {
  console.log( e.data);
  console.log('Message received from worker');
}

myWorker.postMessage(["foo", "bar"]);