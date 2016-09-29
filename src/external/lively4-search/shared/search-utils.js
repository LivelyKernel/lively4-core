export function join(path1, path2) {
  if (path1[path1.length-1] != "/") {
    path1 += "/";
  }
  if (path2[0] == "/") {
    path2 = path2.slice(1, path2.length);
  }
  return path1 + path2;
}

export function ensureLunr() {
  return new Promise((resolve, reject) => {
    if (typeof lunr !== "function") {
      // load lunr
      System.import(lively4url + "/src/external/lunr.js").then(module => {
        window.lunr = module;
        resolve();
      });
    } else {
      // lunr already loaded
      resolve();
    }
  });
}
