
var pendingRequests  = [];
var startSwxTime = Date.now();
// console.log("registering fetch")


// #TODO somehow event.waitUntil does not work....
self.addEventListener("fetch", (event) => {
  if (!pendingRequests) {
    // console.log("[PATCH] no pendingRequests")
    return;
  }
  var url = event.request.url;
  var s = Date.now();
  if (url.toString().match(/https:\/\/lively4\//)) {
  	// console.log("loader fetch " + url);
  	
  	// this is our manual event waiting...
  	// maybe we can use event.waitUnit here?
  	// e.g. event.waitUntil(new Promise((resolve) => setTimeout(resolve, 10000))
  	 
  	var promise = new Promise((resolve, reject) => {
  	  pendingRequests.push({
  		  event: event,
  		  url: url,
  		  resolve: resolve,
  		  reject: reject
  	   });
    });
  	event.respondWith(promise);
    // event.stopPropagation();

  // event.waitUntil(new Promise((resolve) => setTimeout(resolve, 100000)))

  }
});
