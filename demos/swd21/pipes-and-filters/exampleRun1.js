import Pipe from "./pipe.js";
import ActiveFilter from "./activeFilter.js";
import OutputPipe from "./pipe2.js;"

export default class ExampleRun1 {
  
  constructor() {
    this.dataSource = "https://lively-kernel.org/lively4/swd21-pipes-and-filters/demos/swd21/pipes-and-filters/datasource.json";
    this.pipe = new Pipe();
    this.opipe = new OutputPipe();
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
    
    var view = <div></div>
    var inputField = <textarea rows="15" cols="50">{JSON.stringify(JSON.parse(dataFromSource))}</textarea>
    
    var startBtn = <button click={async () => {
          this.startActiveFilter();
        }}>start Active Filter</button>
        
    var btn = 
      <button click={async () => {
            var data = await this.getDataFromSource()
            this.pushDataIntoPipe(data);
        }}>push Data into Pipe</button>
        
   var stopBtn = 
      <button click={ () => {
           this.activeFilter.stop();
        }}>stop Active Filter</button>
    
    var outputField = <textarea rows="15" cols="50" id="outputTextField"></textarea>             
        
   var clearBtn =      
       <button click={ () => {
           outputField.value = "";
        }}>clear Data sink</button>
       
       
    //pass outputField to oPipe 
    this.opipe.setOutputElement(outputField);
    
    //append all items to div and return 
    var btnDiv = <div></div>
    btnDiv.append(startBtn, btn, stopBtn, clearBtn)
    view.append(btnDiv, inputField, outputField)
    
    return view
  }
  
  
  async getDataFromSource() {
    var data =  await fetch(this.dataSource).then(r => r.text())
    return data;
  }

  
  
}

