import Morph from 'src/components/widgets/lively-morph.js';
import focalStorage from 'src/external/focalStorage.js';
//focalStorage.keys()

const GH_TORRENT_URL = 'https://172.16.64.132:5555/sql/';
const FOCALSTORAGE_TOKEN_KEY = 'ghTorrentKey';

class StreamJSONParser {
  constructor(rowsCallback) {
    this.rowsCallback = rowsCallback;
    
    this.isStart = true;
    this.tmpContent = "";
    this.content = "";
  }
  parse(input) {
    this.content += input
    if (this.isStart)  {
      input = input.replace(/^\[\[/, "[");
      input = input.replace(/^ ?,?/, "");
      this.isStart = false;
    } 
    input = this.tmpContent + input;

    try {
      var tmpSrc = "[" + (input).replace(/^( ?,? ?)/, "").replace(/(,? ?)$/, "")  + "]";
      var tmpArray = JSON.parse(tmpSrc);
    } catch(e) {
      // try again... maybe we are at the end
      try {
        var tmpSrc = "[" +  (input).replace(/^( ?,? ?)/, ""); // the end
        var tmpArray = JSON.parse(tmpSrc);
      } catch(e) {
        // console.log("could not parse " + tmpSrc )
        console.log("could not parse JSON with length " + tmpSrc.length );
        window.lastSrc = tmpSrc;
        this.tmpContent = input;
        tmpArray = null;
      }
    }
    if (tmpArray) {
      this.tmpContent = "";
      this.rowsCallback(tmpArray);
    } else {
      // ok, not enough content to parse... lets wait a bit
    }
  }
  finish() {
    try {
      console.log("result: " + JSON.parse(this.content).length);
      console.log("could not parse: " +  this.tmpContent.length);
    } catch(e) {
      lively.showError(e);
    }
  }
}

async function askForUserToken() {
  const token = window.prompt("Please specify your ghTorrentToken");
  await focalStorage.setItem(FOCALSTORAGE_TOKEN_KEY, token);
  return token;
}

async function ghStreamQuery(apiURL, queryString, callback) {
  let query = encodeURIComponent(queryString);
  
  const parser = new StreamJSONParser(callback);
  
  let token = await focalStorage.getItem(FOCALSTORAGE_TOKEN_KEY);
  if(!token) {
    token = await askForUserToken();
  }
  
  const request = new Request(`${apiURL}${query}`, {
    method: "GET",
    headers: {
      "X-Auth-Token": token
    }
  })
  fetch(request).then(r=>r.text()).catch(e=>e)
  lively.files.fetchChunks(
    fetch(request),
    chunk => parser.parse(chunk),
    () => parser.finish()
  );
}

function eachify(callback) {
  let i = 0;
  return rows => rows.forEach(row => callback(row, i++));
}

export default class GhExplorer extends Morph {
  async initialize() {
    this.windowTitle = "GhExplorer";
    
    this.get("#query").addEventListener('keydown',  event => {
      if (event.keyCode == 13) { // ENTER
        if(event.shiftKey) {
          // enter as in line break
        } else {
          this.doQuery();
          event.stopPropagation();
          event.preventDefault();
        }
      }
    });
    
    this.get("#visit-api").addEventListener('click', e => {
      window.open(GH_TORRENT_URL, "blank");
    });
    this.get("#set-token").addEventListener('click', askForUserToken);
    
    this.doQuery();
  }
  doQuery() {
    let onNewRow = (row, i) => {
      this.get("#queryResult").appendChild(<li>{row[1]}</li>);
    };
    
    this.get("#queryResult").innerHTML = "";

    ghStreamQuery(GH_TORRENT_URL, this.get("#query").textContent, eachify(onNewRow));
  }
}