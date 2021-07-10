import PipelineObject from "../components/pipelineObject.js"
import DataSource from "../components/pipelineDataSource.js"
import ActivePipe from "../components/pipelineActivePipe.js"
import DataSink from "../components/pipelineDataSink.js"
import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"
import * as constants from "../utils/pipelineConstants.js"

export default class ActivePipePassiveFilter {
  
  constructor(context) {
    this.context = context
    this.utils = new PipesAndFiltersUtils()
    this.dataSource = {
      buffer: [],
      view: this.context.querySelector("#data-source")
    }
    
    this.dataSink = {
      buffer: [],
      view: this.context.querySelector("#data-sink")
    }
    
    this.filter = {
      buffer: [],
      view: this.context.querySelector("#filter")
    }
    
    this.pipe1 = {
      buffer: [],
      view: this.context.querySelector("#pipe1")
    }
    
    this.pipe2 = {
      buffer: [],
      view: this.context.querySelector("#pipe2")
    }
    
    this.activePipe = new ActivePipe(this.pipe1, this.pipe2, this.filter)
  }
  
  async updateView() {
    this.utils.drawObjects(this.dataSource)
    this.utils.drawObjects(this.pipe1)
    this.utils.drawFilterObject(this.filter)
    this.utils.drawObjects(this.pipe2)
    this.utils.drawObjects(this.dataSink)
  }
  
  async buildButtons() {
    var buttons = <div>
      <button click={event => {
        this.dataSource.buffer.push(new PipelineObject())
        this.updateView()      
      }}>push</button>
      <button click={event => {
        
        let dataSourceObject = this.dataSource.buffer.shift()
        //let pipe1Object = this.pipe1.buffer.shift()
        let filterObject = this.filter.buffer.shift()
        let pipe2Object = this.pipe2.buffer.shift()
        //this.dataSink.buffer.shift()
        
        if(typeof pipe2Object !== "undefined") {
          this.dataSink.buffer.push(pipe2Object)
        }
        /*
        if(typeof filterObject !== "undefined") {
          this.pipe2.buffer.push(filterObject)
        }
        if(typeof pipe1Object !== "undefined") {
          this.filter.buffer.push(pipe1Object)
        }*/
        if(typeof dataSourceObject !== "undefined") {
          this.pipe1.buffer.push(dataSourceObject)
        }
              
        
              
        this.updateView()
      }}>next</button>
          
      <button click={event => {
        //this.pipe1.buffer = this.dataSource.buffer
        //this.dataSource.buffer = []
        //this.updateView();
        
        var dataSource = new DataSource(this.dataSource, this.pipe1)
        dataSource.pushToPipe(() => {
          this.updateView()
        })
        
              
        var dataSink = new DataSink(this.dataSink, this.pipe2)
        dataSink.getFromPipe(() => {
          this.updateView()
        })
              
        //var activePipe = new ActivePipe(this.pipe1, this.pipe2)
        this.activePipe.pipeActive(async (object) => {

          await this.sleep(2500)
          //return await new Animation(object, class, 2500)
          
          if(object.color.includes("red")) {
            return object
          }


        }, () => {
          this.updateView()
        });
        
        
      }} >startActivePipe</button>
          
      <button click={event => {
          this.activePipe.stop()  
        
        }} >stopActivePipe</button>

    </div>
    return buttons
  }
  
  
  fillDataSourceWithNRandomForms(n) {
    
    if(this.dataSource.view.style.display != "none") {
      this.pushNdata(this.dataSource, n)
    }
    
    if(this.pipe1.view.style.display != "none") {
      this.pushNdata(this.pipe1, 2)
    }
    
    if(this.filter.view.style.display != "none") {
      this.pushNdata(this.filter, 1)
    }
    
    if(this.pipe2.view.style.display != "none") {
      this.pushNdata(this.pipe2, 3)
    }
    
    if(this.dataSink.view.style.display != "none") {
      this.pushNdata(this.dataSink, 5)
    }
    

    this.updateView();

  }

  
  pushNdata(component, n) {
    for (let i = 0; i < n; i++) {
      component.buffer.push(new PipelineObject());
    }
    
  }

 sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}