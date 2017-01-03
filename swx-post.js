
console.log("loaded SWX bootstrap in " + (Date.now() - startSwxTime) + "ms");

System.import("/swx.js").then( () => {
  console.log("loaded swx in " + (Date.now() - startSwxTime) + "ms");
});