import Files from "src/client/files.js";
import * as dropboxSearch from "../../../../lively4-server/src/lunr-search.js";
import * as serverSearch from "src/client/search/server-search.js";
import * as githubSearch from "src/client/search/github-search.js";


let availableMounts = {
  "dropbox" : {},
  "server": {},
  "github": {}
}

let unboundSearchFns = {
  "server" : serverSearch,
  "dropbox" : dropboxSearch,
  "github" : githubSearch
}

let searchFunctions = {
  "dropbox" : [],
  "server" : [],
  "github" : []
}

function loadMounts() {
  // find all dropboxes
  dropboxSearch.setRootFolder("https://lively4");
  let mountRequest = new Request("https://lively4/sys/mounts");
  let dbPromise = fetch(mountRequest).then(resp => {
    return resp.json();
  }).then(mounts => {
    mounts.filter(m => {
      return m.name === "dropbox" || m.name === "github";
    }).forEach(db => {
      availableMounts[db.name][db.path] = db;
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
    // Object.keys(availableMounts.dropbox).forEach(path => {
    //   loadIndex("dropbox", path);
    // });
    
    Object.keys(availableMounts.github).forEach(path => {
      loadIndex("github", path);
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
    let mount = availableMounts[mountType][path];
    if (!mount) {
      throw new Error(`Mount not found at ${path}`);
    }
    return unboundSearchFns[mountType].setup(mount).then(() => {
      searchFunctions[mountType].push(unboundSearchFns[mountType].find.bind(mount));
    });
  });
}

export function getStatus(mountType, path) {
  if (mountType === "dropbox" || mountType === "server") {
    let db = availableMounts[mountType][path];
    if (!db) {
      return Promise.reject("Mount not found");
    }

    return unboundSearchFns[mountType].checkIndexFile(path, db);
  }
  
  if (mountType === "github") {
    return Promise.resolve();
  }

  return Promise.reject("unknown mount type");
}

export function search(query) {
  let proms = [];

  for (let type in searchFunctions) {
    searchFunctions[type].forEach(func => {
      proms.push(func(query));
    });
  };

  return proms;
}


loadMounts();
