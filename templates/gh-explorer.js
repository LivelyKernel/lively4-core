import Morph from './Morph.js';

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

function ghStreamQuery(apiURL, queryString, callback) {
  let query = encodeURIComponent(queryString);
  
  const parser = new StreamJSONParser(callback);
  
  lively.files.fetchChunks(
    fetch(`${apiURL}${query}`),
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
    
    this.doQuery();
  }
  doQuery() {
    let onNewRow = (row, i) => {
      let li = document.createElement("li");
      li.textContent = i + " " + row[1];
      this.get("#queryResult").appendChild(li);
    };
    
    this.get("#queryResult").innerHTML = "";

    ghStreamQuery('https://172.16.64.132:5555/sql/', this.get("#query").textContent, eachify(onNewRow));
  }
}