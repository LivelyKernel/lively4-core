console.log("TEST LOADER ")
// make it async
window.__karma__.loaded = function() {};


var script = document.createElement("script");
script.charset = "utf-8";
script.type = "text/javascript";
script.src = 'src/client/boot.js';
document.head.appendChild(script);

document.addEventListener("livelyloaded", function(evt) {
  System.import("./base/test-main.js")
})