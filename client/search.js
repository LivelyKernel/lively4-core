import Files from "src/client/files.js";
import * as lunrSearch from "../shared/lunr-search.js";
import * as serverSearch from "./server-search.js";
import * as githubSearch from "./github-search.js";

let searchModules = {
  "server" : serverSearch,
  "dropbox" : lunrSearch,
  "github" : githubSearch
};

let availableMounts = {};
let searchFunctions = {};

function initialize() {
  for (let type in searchModules) {
    availableMounts[type] = {};
    searchFunctions[type] = [];
  }
  loadMounts();
}

function loadMounts() {
  lunrSearch.setRootFolder("https://lively4");

  // initialize mounts, except for server mounts
  let mountRequest = new Request("https://lively4/sys/mounts");
  let mountPromise = fetch(mountRequest).then(resp => {
    return resp.json();
  }).then(mounts => {
    mounts.filter(m => {
      return m.name !== "server" && searchModules[m.name];
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

  return Promise.all([mountPromise, serverPromise]).then(() => {
    // check all available mounts (server folders and mounts) if there is an index available,
    // activate search when there is one
    for (let type in availableMounts) {
      for (let path in availableMounts[type]) {
        getStatus(type, path).then(status => {
          if (status === "available" || status === "ready") {
            prepareForSearch(type, path);
          }
        });
      }
    }
  });
}

export function getAvailableMounts() {
  return availableMounts;
}

export function prepareForSearch(mountType, path) {
  let mount = availableMounts[mountType][path];
  if (!mount) {
    throw new Error(`Mount not found at ${path}`);
  }
  return searchModules[mountType].setup(mount).then(() => {
    searchFunctions[mountType].push(searchModules[mountType].find.bind(mount));
  });
}

export function getStatus(mountType, path) {
  let db = availableMounts[mountType][path];
  if (!db) {
    return Promise.reject("Mount not found");
  }

  return searchModules[mountType].getStatus(path, db);
}

export function search(query) {
  let proms = [];

  for (let type in searchFunctions) {
    searchFunctions[type].forEach(func => {
      proms.push(func(query));
    });
  }

  return proms;
}


initialize();
