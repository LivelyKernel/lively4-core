'use strict'

export function loadIndexJson(l4idxFile, options) {
  // TODO
}

export function saveIndexJson(jsonIndex, filename, options) {
  // TODO
}

async function getFilepaths(options) {
  let query = ".js";
  let fileLimit = 10000;
  let req = `https://api.dropboxapi.com/1/search/auto${options.options.subfolder}?query=${query}&file_limit=${fileLimit}`;

  let responseJson = await fetch(req, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${options.options.token}`,
      "Content-Type": "application/json"
    }
  }).then(resp => { return resp.json(); });

  let filepaths = responseJson.filter(file => {
    // ensure that this is really a js-file
    return file.path.slice(-3) === ".js";
  }).map(file => {
    // remove the subfolder from the file path
    return file.path.slice(options.options.subfolder.length);
  });

  return filepaths;
}

export async function* FileReader(filepath, options) {
  let filepaths;
  if (typeof filepath === "object") {
    // no filepath given
    options = filepath;
    filepaths = await getFilepaths(options);
  } else {
    filepaths = [filepath];
  }

  for (let i = 0; i < filepaths.length; i++) {
    var path = filepaths[i];
    var content = await fetch(`https://lively4${options.path}${path}`).then(resp => { return resp.text(); });
    yield {
      path: path,
      filename: path.slice(path.lastIndexOf("/") + 1),
      content: content
    }
  }
}
