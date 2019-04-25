
// importScripts('src/worker/service-worker.js');


var pendingRequests  = []; // will be used in boot and unset in swx
var startSwxTime = Date.now();

try {
  importScripts('swx-boot.js');
} catch(e) {
  debugger
}
  