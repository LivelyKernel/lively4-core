import Files from "src/client/files.js";
import * as dropboxSearch from "../../../../lively4-server/src/lunr-search.js";

let availableMounts = {
  "dropbox": {},
  "server": {}
}

let searchableMounts = [];
let searchFunctions = [];

function loadMounts() {
  // find all dropboxes
  dropboxSearch.setRootFolder("https://lively4");
  let mountRequest = new Request("https://lively4/sys/mounts");
  let dbPromise = fetch(mountRequest).then(resp => {
    return resp.json();
  }).then(mounts => {
    mounts.filter(m => {
      return m.name === "dropbox";
    }).forEach(db => {
      // db.status = "unknown";
      availableMounts["dropbox"][db.path] = db;
    });
  }).catch(err => {
    lively.notify("Error: ", err, 5);
  });

  // find all repos on the server
  let serverPromise = Files.statFile(lively4url + "/..").then(res => {
    return JSON.parse(res);
  }).then(jsonRes => {
    return jsonRes.contents.filter(file => {
      return file.type === "directory";
    }).map(dir => {
      dir.path = "/" + dir.name;
      // dir.status = "unknown";
      return dir;
    }).forEach(repo => {
      availableMounts["server"][repo.path] = repo;
    });
  });

  return Promise.all([dbPromise, serverPromise]).then(() => {
    // Object.keys(availableMounts.dropbox).forEach(path => {
    //   let db = availableMounts.dropbox[path];
    //   dropboxSearch.checkIndexStatus(db).then(status => {
    //     db.status = status;
    //   });
    // });
    
  });
}

export function getAvailableMounts() {
  return availableMounts;
}

export function loadIndex(mountType, path) {
  // use getStatus here temporarily to ensure worker is running
  return getStatus(mountType, path).then(status => {
    let db = availableMounts.dropbox[path];
    if (!db) {
      throw new Error("Mount not found");
    }
    return dropboxSearch.setup(db).then(() => {
      // db.find = dropboxSearch.find;
      searchFunctions.push(dropboxSearch.find.bind(db));
    });
  });
}

export function getStatus(mountType, path) {
  if (mountType === "dropbox") {
    let db = availableMounts.dropbox[path];
    if (!db) {
      return Promise.reject("Mount not found");
    }
    
    return dropboxSearch.checkIndexFile(path, db);
  }
  
  if (mountType === "server") {
    return Promise.reject("not implemented");
  }
  
  return Promise.reject("unknown mount type");
}

export function search(query) {
  let proms = [];
  searchFunctions.forEach(func => {
    proms.push(func(query));
  });
  
  return Promise.all(proms).then(results => {
    let res = results.reduce((a, b) => {
      return a.concat(b);
    }, []);
    console.log(res);
    return res;
  });
}


loadMounts();
