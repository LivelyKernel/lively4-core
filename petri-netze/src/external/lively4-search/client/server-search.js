import * as utils from "../shared/search-utils.js";

export function setup(options) {
  return new Promise((resolve, reject) => {
    let location = options.path.replace(window.location.origin, "");
    console.log("setup location:", options.path);

    let fetchStatus =  () => {
      fetch(`api/search/createIndex?location=${location}`).then( async (response) => {
        let responseJson = await response.json();
        if (responseJson.indexStatus == "available") {
          resolve();
          clearInterval(interval);
        }
      }, () => {
        reject();
      });
    };

    fetchStatus();
    let interval = setInterval(fetchStatus, 5000);
  });
}

export function find(pattern) {
  // find is bound to the mount object, so -this- is the mount
  let location = this.path.replace(window.location.origin, "");

  // test
  return fetch(`api/search/search?q=${pattern}&location=${location}`).then( async (response) => {
    if (response.status != 200) {
      return [];
    }

    let responseJson = await response.json();
    return responseJson.map((res) => {
      let rootUrl = lively4url.slice(0, lively4url.lastIndexOf("/"));
      res.path = rootUrl + utils.join(this.path, res.ref);
      res.type = "server";
      return res;
    });
  });
}

export function getStatus(subdir, options) {
  return fetch(`api/search/statusIndex?location=${subdir}`).then((response) => {
    return response.json();
  }).then(responseJson =>{
    return responseJson.indexStatus;
  });
}

export function removeIndex(subdir, options) {
  return fetch(`api/search/removeIndex?location=${subdir}`);
}
