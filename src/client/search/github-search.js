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
    let responseJson = await response.json()

    console.log("[Search] Github-search");
    console.log(`[Search] Found ${responseJson.total_count} items for the search term: ${pattern}`);

    for (let item of responseJson.items) {
      console.log(`[Search] Item: ${item.path} with score: ${item.score}`);
    }

    return _.map(responseJson.items, (item) => _.pick(item, ["path", "score"]));
  });
}
