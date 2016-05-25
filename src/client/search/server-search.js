export function setup(options) {
  return Promise.resolve();
}

export function find(pattern) {
  // find is bound to the mount object, so -this- is the mount
  let location = this.path.replace(window.location.origin, "");

  return fetch(`${window.location.origin}/api/search?q=${pattern}&location=${location}`).then( async (response) => {
    let responseJson = await response.json()
    return responseJson.map((res) => {
      res.path = this.path + res.ref;
      return res;
    });
  });
}
