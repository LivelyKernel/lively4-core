import Morph from './Morph.js';

    
class StreamJSONParser {
  constructor() {}
  
}

class MagicBox {
  constructor() {}
  
}

export default class GhExplorer extends Morph {
  async initialize() {
    this.windowTitle = "GhExplorer";
    
    this.get("#query").addEventListener('keydown',  event => {
      if (event.keyCode == 13) { // ENTER
        if(event.shiftKey) {
          // enter as in line break
        } else {
          this.query();
          event.stopPropagation();
          event.preventDefault();
        }
      }
    });
    this.query();
  }
  query() {
    let i = 0;
    let onRows = rows => {
      rows.forEach(row => {
        i++;
        onNewRow(row, i);
      });
    };
    
    let onNewRow = (row, i) => {
      let li = document.createElement("li");
      li.textContent = i + " " + row[1];
      this.get("#queryResult").appendChild(li);
    };
    
    let apiURL = 'https://172.16.64.132:5555/sql/';
    let query = encodeURIComponent( this.get("#query").textContent);
    let isStart = true;
    let tmpContent = "";
    let content = "";
    
    this.get("#queryResult").innerHTML = "";
    lively.files.fetchChunks(fetch(`${apiURL}${query}`), ea => {
      content += ea
      if (isStart)  {
        ea = ea.replace(/^\[\[/, "[");
        ea = ea.replace(/^ ?,?/, "");
        isStart = false;
      } 
      ea = tmpContent + ea;
    
      try {
        var tmpSrc = "[" + (ea).replace(/^( ?,? ?)/, "").replace(/(,? ?)$/, "")  + "]";
        var tmpArray = JSON.parse(tmpSrc);
      } catch(e) {
        // try again... maybe we are at the end
        try {
          var tmpSrc = "[" +  (ea).replace(/^( ?,? ?)/, ""); // the end
          var tmpArray = JSON.parse(tmpSrc);
        } catch(e) {
          // console.log("could not parse " + tmpSrc )
          console.log("could not parse JSON with length " + tmpSrc.length );
          window.lastSrc = tmpSrc;
          tmpContent = ea;
          tmpArray = null;
        }
      }
      if (tmpArray) {
        tmpContent = "";
        onRows(tmpArray);
      } else {
        // ok, not enough content to parse... lets wait a bit
      }
    }, () => {
      try {
        console.log("result: " + JSON.parse(content).length);
        console.log("could not parse: " +  tmpContent.length);
      } catch(e) {
        this.get("#queryResult").textContent = content;
      }
    });
  }
}