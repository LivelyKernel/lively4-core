// let Ofetch = fetch;
// fetch = function(...args) {
//   console.warn('FETCH' + args[0].url)
//   return Ofetch(...args);
// }

self.addEventListener('install', (event) => {
  console.log("SWX Install Event")
})

self.oninstall = function() {
  console.log("SWX oninstall Event") // why are they not called? Sometimes they are?
}


function getChromeVersion () {     
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    return raw ? parseInt(raw[2], 10) : false;
}

// console.log("chrome version: " + getChromeVersion())
var postfix = ""

// #TODO only while developing
// postfix += Date.now()


if (getChromeVersion() < 60) {
  console.log("disable SWX for now")
} else {
  console.log("SWX pre...")

  importScripts('swx-pre.js');
  
  try {
    importScripts('swx-boot.js');
  } catch(e) {
    debugger
  }
  
  console.log("boot loaded...")
  importScripts('swx-post.js');
}