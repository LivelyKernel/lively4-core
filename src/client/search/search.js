import Files from "src/client/files.js";
import * as dropboxSearch from "../../../../lively4-server/src/lunr-search.js";
import * as serverSearch from "src/client/search/server-search.js";

let availableMounts = {
  "dropbox": {},
  "server": {}
}

let searchableMounts = [];
let searchFunctions = {
  "dropbox": [],
  "server": []
}

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
      availableMounts.dropbox[db.path] = db;
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
      return dir;
    }).forEach(repo => {
      availableMounts.server[repo.path] = repo;
    });
  });

  return Promise.all([dbPromise, serverPromise]).then(() => {
    Object.keys(availableMounts.dropbox).forEach(path => {
      loadIndex("dropbox", path);
    });

    loadIndex("server", "/" + window.location.pathname.split("/")[1]);
  });
}

export function getAvailableMounts() {
  return availableMounts;
}

export function loadIndex(mountType, path) {
  // use getStatus here temporarily to ensure worker is running
  return getStatus(mountType, path).then(status => {
    if (mountType === "dropbox") {
      let db = availableMounts.dropbox[path];
      if (!db) {
        throw new Error(`Mount not found at ${path}`);
      }
      return dropboxSearch.setup(db).then(() => {
        // db.find = dropboxSearch.find;
        searchFunctions.dropbox.push(dropboxSearch.find.bind(db));
      });
    }

    if (mountType === "server") {
      let dir = availableMounts.server[path];
      if (!dir) {
        throw new Error(`Folder not found at ${path}`);
      }
      return serverSearch.setup(dir).then(() => {
        searchFunctions.server.push(serverSearch.find.bind(dir));
      });
    }
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
    let dir = availableMounts.server[path];
    if (!dir) {
      return Promise.reject("Folder not found");
    }

    return serverSearch.checkIndexFile(path, dir);

    return Promise.reject("not implemented");
  }

  return Promise.reject("unknown mount type");
}

function getLabel(str) {
  // shorten the string
  return str.length < 60 ? str : str.slice(0,15) + " [...] " + str.slice(-40);
}

export function search(query) {
  let proms = [];
  searchFunctions.dropbox.forEach(func => {
    proms.push(func(query).then(results => {
      results.forEach(res => {
        res.label = getLabel(res.path);
      });
      return results;
    }));
  });

  searchFunctions.server.forEach(func => {
    proms.push(func(query).then(results => {
      results.forEach(res => {
        res.path = window.location.origin + res.path;
        res.label = getLabel(res.path);
      });
      return results;
    }));
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
