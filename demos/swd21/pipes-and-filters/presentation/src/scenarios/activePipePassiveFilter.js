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
    
    this.activePipe = new ActivePipe(this.pipe1, this.pipe2)
  }
  
  async updateView() {
    this.dataSource.view.querySelectorAll('*').forEach(n => n.remove());
    this.dataSource.buffer.forEach(object => {
      this.dataSource.view.append(object.drawDiv())
    })
    
    this.dataSink.view.querySelectorAll('*').forEach(n => n.remove());
    this.dataSink.buffer.forEach(object => {
      this.dataSink.view.append(object.drawDiv())
    })
    
    this.filter.view.querySelectorAll('*').forEach(n => n.remove());
    this.filter.buffer.forEach(object => {
      this.filter.view.append(object.drawDiv())
    })
    
    this.pipe1.view.querySelectorAll('*').forEach(n => n.remove());

    // change order to draw correctly into the pipes
    var changedOrderPipe1 = await
    this.utils.preparePipeBufferForDraw(this.pipe1.buffer)

    changedOrderPipe1.forEach(object => {
      this.pipe1.view.append(object.drawDiv())
    })
    
    this.pipe2.view.querySelectorAll('*').forEach(n => n.remove());
    
    var changedOrderPipe2 = await this.utils.preparePipeBufferForDraw(this.pipe2.buffer)
    changedOrderPipe2.forEach(element => {
      this.pipe2.view.append(element.drawDiv())
    })
   
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
        this.activePipe.filter((object) => {

          object.setType(constants.Type.CIRCLE)
          object.setColor("color-blue", "object-square")
          
          return object
        }, () => {
          this.updateView()
        }, this.context);
        
        
      }} >startActivePipe</button>
          
      <button click={event => {
          this.activePipe.stop()  
        
        }} >stopActivePipe</button>

    </div>
    return buttons
  }
  
  
  fillDataSourceWithNRandomForms(n) {
    for (let i = 0; i <= n; i++) {
      this.dataSource.buffer.push(new PipelineObject());
    }
    
    this.updateView();

  }

}