
console.log("test worker loaded!")

export function onmessage(evt) {
  // Message received from main script'
  var workerResult = 'Result: ' + (evt.data[0] * evt.data[1]);
  // Posting message back to main script'
  postMessage(workerResult);
}
