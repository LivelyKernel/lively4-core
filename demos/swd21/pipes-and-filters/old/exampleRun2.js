import Pipe from "./pipe.js";
import ActiveFilter from "./activeFilter.js";
import OutputPipe from "./pipe2.js;"
import PipeActive from "./pipeActive.js"
import FilterPassive from "./filterPassive.js"

export default class ExampleRun2 {
  
  constructor() {
    this.dataSource = "https://lively-kernel.org/lively4/swd21-pipes-and-filters/demos/swd21/pipes-and-filters/datasource.json";
    this.pipe = new Pipe();
    this.opipe = new OutputPipe();
    
    this.opipePassive = new OutputPipe();
    
    this.filterPassive = new FilterPassive((elements) => {
      var parsedElements = JSON.parse(elements)
      return parsedElements.filter(elem => elem.name != "Apfel")
    }, this.opipePassive)
    this.pipeActive = new PipeActive(this.filterPassive)
    
    this.activeFilter = new ActiveFilter(this.pipe, this.opipe)
    
  }
  
  
  // pushes Data into pipe as it is a active filter that checks the pipe in an interval
  pushDataIntoPipe(newData) {
    this.pipe.pushElement(newData)
  }
  
  
  // runs the active filter
  async startActiveFilter() {
    this.activeFilter.activeFilterData()
  }
  
  async createExampleRun(){
    var dataFromSource = await this.getDataFromSource();
    var parsedData = JSON.parse(dataFromSource)
    
    var view = <div></div>
    var inputField = <textarea rows="15" cols="50">{JSON.stringify(parsedData)}</textarea>
    
    var startBtn = <button click={async () => {
          this.startActiveFilter();
        }}>start Active Filter</button>
        
    var btn = 
      <button click={async () => {
            this.pushDataIntoPipe(parsedData.shift());
            inputField.value = JSON.stringify(parsedData)
        }}>push Data into Pipe</button>
        
   var stopBtn = 
      <button click={ () => {
           this.activeFilter.stop();
        }}>stop Active Filter</button>
    
  var outputField = <textarea rows="15" cols="50" id="outputTextField"></textarea>
  var outputFieldPassive = <textarea rows="15" cols="50" id="outputTextFieldPassive"></textarea>
        
   var resetBtn =      
       <button click={ () => {
           outputField.value = "";
           outputFieldPassive.value = "";
           parsedData = JSON.parse(dataFromSource)
           inputField.value = JSON.stringify(parsedData)
        }}>reset all</button>
       
   var startActivePipeBtn =      
       <button click={ () => {
           // TODO call active pipe
           
           this.pipeActive.addElement(outputField.value)
        }}>start active pipe</button>
       
       
    //pass outputField to oPipe 
    this.opipe.setOutputElement(outputField);
    //pass outputField to oPipe 
    this.opipePassive.setOutputElement(outputFieldPassive)
    
    var divDataSource = <div></div>
    divDataSource.append(inputField)
    
    var divButtons1 = <div></div>
    divButtons1.append(startBtn, btn, stopBtn)
    
    var divBuffer = <div></div>
    divBuffer.append(outputField)
    
    var divButtons2 = <div></div>
    divButtons2.append(startActivePipeBtn)
    
    var divBuffer2 = <div></div>
    divBuffer2.append(outputFieldPassive)
    
    var divResetAll = <div></div>
    divResetAll.append(resetBtn)
    
    view.append(divDataSource, divButtons1, divBuffer, divButtons2, divBuffer2, divResetAll)
    
    return view
  }
  
  
  async getDataFromSource() {
    var data =  await fetch(this.dataSource).then(r => r.text())
    return data;
  }

  
  
}

