function getReadableFileExtensions() {
  return [".js", ".md", ".html"];
}

export async function loadSearchIndex(pathToIdx) {
  let response = await fetch(pathToIdx);
  let responseJson = await response.json();

  if (typeof lunr !== "function") {
    window.lunr = await System.import(lively4url + "/src/external/lunr.js");
  }

  return buildSearchIndex(responseJson);
}

function buildSearchIndex(indexJson) {
  var jsTokenizer = function (obj) {
    let jsTokens = /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyu]{1,5}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]{1,6}\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-*\/%&|^]|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g
    if (!arguments.length || obj == null || obj == undefined) return []
    if (Array.isArray(obj)) return obj.map(function (t) { return lunr.utils.asString(t).toLowerCase() })

    return obj.toString().trim().toLowerCase().match(jsTokens);
  }

  // register tokenizer function to allow index serialization
  lunr.tokenizer.registerFunction(jsTokenizer, "jsTokenizer");

  return lunr.Index.load(indexJson);
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
