import * as utils from "./search-utils.js";
import Files from "src/client/files.js";

function getReadableFileExtensions() {
  return [".js", ".md", ".html"];
}

export function setup(db) {
  return restoreIndex(db);
}

export function checkIndexStatus(db) {
  return new Promise((resolve, reject) => {
    let path = `https://lively4${db.path}/index.l4idx`;
    Files.statFile(path).then(resp => {
      return JSON.parse(resp);
    }).then(jsonResp => {
      // ugly way to check if file exists (we dont get a 404...)
      if (jsonResp.size === "0 bytes") {
        resolve("unavailable");
      } else {
        resolve("available");
      }
    });  
  });
  
  
  // fetch(path).then(response => {
  //   console.log(response);
  // }).catch(err => {
  //   console.log("not found")
  // });
}

function restoreIndex(db) {
  let path = `https://lively4${db.path}/index.l4idx`;
  return loadSearchIndex(path).then(buildSearchIndex).then(index => {
    db.index = index;
  }).catch(error => {
    lively.notify("Error: ", `Cannot load ${path}`, 10);
  });
}

function loadSearchIndex(pathToIdx) {
  return fetch(pathToIdx).then(response => {
    if (!response.ok) {
      reject(response);
    } else {
      return response.json();
    }
  }).catch(error => {
    lively.notify("Error: ", "failed to load dropbox index: " + error.message, 5);
  });
}

function buildSearchIndex(indexJson) {
  return utils.ensureLunr().then(() => {
    var jsTokenizer = function (obj) {
      let jsTokens = /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyu]{1,5}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]{1,6}\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-*\/%&|^]|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g
      if (!arguments.length || obj == null || obj == undefined) return []
      if (Array.isArray(obj)) return obj.map(function (t) { return lunr.utils.asString(t).toLowerCase() })

      return obj.toString().trim().toLowerCase().match(jsTokens).filter(function(token) { return token.length < 30; });
    }

    // register tokenizer function to allow index serialization
    lunr.tokenizer.registerFunction(jsTokenizer, "jsTokenizer");

    return lunr.Index.load(indexJson);
  });
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

export function find(query) {
  return new Promise((resolve, reject) => {
    // find is bound to the mount object, so -this- is the mount
    if (this.index) {
      resolve(this.index.search(query).map((res) => {
        res.path = utils.join(this.path, res.ref);
        res.type = "dropbox";
        return res;
      }));
    }
    resolve([]);
  });
}
