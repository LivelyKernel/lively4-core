function encodeQueryData(data) {
   var ret = [];
   for (let d in data)
      ret.push(encodeURIComponent(d) + ":" + encodeURIComponent(data[d]));
   return ret.join("+");
}

export async function search(pattern, options) {


  let queryOptions = {
    in: "file,path",
    repo: options.repo
  }
  let queryOptionsString = encodeQueryData(queryOptions);

  let headers = {
      method: 'GET',
  }
  // Add authorization header for private repos
  if (options.token) {
    headers["Authorization"] = "token " + options.token
  }

  let response = await fetch('https://api.github.com/search/code?q=' + pattern + "+" + queryOptionsString, headers);
  let responseJson = await response.json()

  console.log("[Search] Github-search");
  console.log("[Search] Found " + responseJson.total_count + " items for the search term: " + pattern);

  for (let item of responseJson.items) {
    console.log("[Search] Item: " + item.path + " with score: " + item.score);
  }

}
