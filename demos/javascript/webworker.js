
// Not supportet yet:
// import calc from "./webworker-module.js";

console.log("hello");

async function a() {
  await new Promise(r => setTimeout(r, 1000))
}

onmessage = async function(e) {
  console.log('Message received from main script');
  var workerResult = 'Result: ' + (e.data[0] + e.data[1]);
  console.log('Posting message back to main script');
  await a();
  postMessage(workerResult);
};