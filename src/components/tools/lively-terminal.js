import Morph from "src/components/widgets/lively-morph.js"

export default class LivelyTerminal extends Morph {

  initialize() {
    this.runningProcess = "";
    this.windowTitle = "Terminal";
    this.input = this.get("#terminalIn");
    this.output = this.get("#terminalOut");
    this.inLine = this.get("#inputLine");
    this.terminal = this.get("#terminal");
    
    this.input.addEventListener("keyup", (event) => {
      if (event.keyCode === 13) {
        this.runCommand();
      }
    });
    this.terminal.addEventListener("click", (event) => {
      if (this.runningProcess !== "") {
        this.httpGet("http://localhost:5000/kill/" + this.runningProcess, (data) => {
          console.log("kill process");
        });
        this.endProcess();
      }
      this.input.focus();
    });
    this.input.focus();
  }
  
  httpGet(url, callback)
  {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url );
    xmlHttp.onload = () => {
      callback(xmlHttp.responseText);
    }
    xmlHttp.send(null);
  }

  runCommand() {
    console.log("running" + this.input.value);
    this.output.innerHTML += "> " + this.input.value + "<br>";
    this.inLine.style.visibility = "hidden";
    this.httpGet("http://localhost:5000/new/" + this.input.value, (processId) => {
      this.runningProcess = processId;
      console.log("starting new process: " + processId);
      this.runLoop();
    });
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
      this.httpGet("http://localhost:5000/stdout/" + this.runningProcess, (output) => {
        console.log(output);
        this.addToOutput(output);
        this.httpGet("http://localhost:5000/stderr/" + this.runningProcess, (error) => {
          this.addToOutput(error);

          this.httpGet("http://localhost:5000/end/" + this.runningProcess, (ended) => {
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
