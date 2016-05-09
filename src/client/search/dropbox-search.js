function getReadableFileExtensions() {
  return [".js", ".md", ".html"];
}

export async function getSearchableFileNames(options) {
  let headers = {
    method: "POST",
    Authorization: "Bearer " + options.token,
  }

  headers["Content-Type"] = "application/json";

  let response = await fetch("https://api.dropboxapi.com/2-beta-2/files/search", {
  // let response = await fetch("https://api.dropboxapi.com/1/search/auto/", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + options.token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      path: "",
      query: ".js"
    })
  });

  let responseJson = await response.json();
  let results = responseJson.matches.map(match => {
    return {
      path: match.metadata.path_lower,
      revision: match.metadata.rev
    }
  });

  return results;
}
