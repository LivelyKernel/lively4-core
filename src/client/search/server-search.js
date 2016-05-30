import * as utils from "./search-utils.js";

export function setup(options) {
  return Promise.resolve();
}

export function find(pattern) {
  // find is bound to the mount object, so -this- is the mount
  let location = this.path.replace(window.location.origin, "");

  // test
  return fetch(`${window.location.origin}/api/search?q=${pattern}&location=${location}`).then( async (response) => {
    let responseJson = await response.json()
    return responseJson.map((res) => {
      res.path = utils.join(this.path, res.ref);
      res.type = "server";
      return res;
    });
  });
}
