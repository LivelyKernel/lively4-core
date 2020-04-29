import * as utils from "../shared/search-utils.js";

function encodeQueryData(data) {
   var ret = [];
   for (let d in data)
      ret.push(`${encodeURIComponent(d)}:${encodeURIComponent(data[d])}`);
   return ret.join("+");
}

export function setup(options) {
  return Promise.resolve();
}

export function find(pattern) {
  // find is bound to the mount object, so -this- is the mount
  let options = this.options;
  let queryOptions = {
    in: "file,path",
    repo: options.repo
  };
  let queryOptionsString = encodeQueryData(queryOptions);

  let headers = {
    method: 'GET',
  };
  // Add authorization header for private repos
  if (options.token) {
    headers["Authorization"] = `token ${options.token}`;
  }

  return fetch(`https://api.github.com/search/code?q=${pattern}+${queryOptionsString}`, headers).then( async (response) => {
    let responseJson = await response.json();

    return _.map(responseJson.items, (item) => {
      let strippedItem = _.pick(item, ["path", "score"]);
      strippedItem.path = utils.join(this.path, strippedItem.path);
      strippedItem.type = "github";
      return strippedItem;
    });
  });
}

export function getStatus(path, options) {
  return Promise.resolve("available");
}
