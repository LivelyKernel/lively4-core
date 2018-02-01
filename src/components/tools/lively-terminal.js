import Morph from "src/components/widgets/lively-morph.js"

export default class LivelyTerminal extends Morph {

  initialize() {
    this.runningProcess = "";
    this.windowTitle = "Terminal";
    this.input = this.get("#terminalIn");
    this.output = this.get("#terminalOut");
    this.inLine = this.get("#inputLine");
    this.terminal = this.get("#terminal");
    this.port = -1;
    
    this.input.addEventListener("keyup", (event) => {
      if (event.keyCode === 13) {
        this.runCommand();
      }
    });
    this.terminal.addEventListener("click", (event) => {
      if (this.runningProcess !== "") {
        this.httpGet("http://localhost:"+this.port+"/kill/" + this.runningProcess, (data) => {
          console.log("kill process");
        });
        this.endProcess();
      }
      this.input.focus();
    });
    this.input.focus();
  }
  
  storePort() {
    if (this.port != -1) {
      return;
    }
    let url = document.URL;
    if (url.indexOf("http://localhost:") > -1) {
      this.port = parseInt(url.split(":")[2].split("/")[0]) + 1;
      console.log("terminal server port: " + this.port);
    } else {
      this.port = -1;
    }
  }
  
  httpGet(url, callback)
  {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url );
    xmlHttp.onreadystatechange = () => {
      if (xmlHttp.readyState === 4) {
        if(xmlHttp.status === 200){
          callback(xmlHttp.responseText);
        } else {
          callback(false);
        }
      }
    }
    xmlHttp.send(null);
  }

  runCommand() {
    this.storePort();
    this.httpGet("http://localhost:"+ this.port +"/terminalserver/", (data) => {
      if (data && data === "running terminalserver") {
        console.log("running: " + this.input.value);
        this.output.innerHTML += "> " + this.input.value + "<br>";
        this.inLine.style.visibility = "hidden";
        this.httpGet("http://localhost:"+this.port+"/new/" + this.input.value, (processId) => {
          this.runningProcess = processId;
          console.log("starting new process: " + processId);
          this.runLoop();
        });
      } else {
        this.output.innerHTML += "No terminal server running: check https://github.com/LivelyKernel/lively4-app for more information <br>";
      }
    })  
  }
  
  addToOutput(list) {
    list = JSON.parse(list);
    for (var i = 0; i < list.length; i++) {
      this.output.innerHTML += list[i].replace(/\n/g,"<br>");
    }
    this.terminal.scrollTop = this.terminal.scrollHeight;
    
  }
  
  endProcess() {
      this.runningProcess = "";
      this.inLine.style.visibility = "visible";
      this.input.value = "";
      this.input.focus();
  }
  
  runLoop() {
    if (this.runningProcess !== "") {
      this.httpGet("http://localhost:"+this.port+"/stdout/" + this.runningProcess, (output) => {
        this.addToOutput(output);
        this.httpGet("http://localhost:"+this.port+"/stderr/" + this.runningProcess, (error) => {
          this.addToOutput(error);

          this.httpGet("http://localhost:"+this.port+"/end/" + this.runningProcess, (ended) => {
            if (ended === "true") {
              this.endProcess();
              
            } else {
              setTimeout(() => {
                this.runLoop();
              }, 100);
            }
          });
        });
      });
    } 
  }
}
