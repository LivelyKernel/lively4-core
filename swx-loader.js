
function getChromeVersion () {     
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    return raw ? parseInt(raw[2], 10) : false;
}

// console.log("chrome version: " + getChromeVersion())

if (getChromeVersion() < 60) {
  console.log("disable SWX for now")
} else {
  console.log("ok, lets work on it... SWX")

  importScripts('swx-pre.js?'/* + Date.now()*/);
  importScripts('swx-boot.js?'/* + Date.now()*/);
  console.log("boot loaded...")

  importScripts('swx-post.js?'/* + Date.now()*/);
}