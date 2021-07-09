import PipelineObject from "./pipelineObject.js"

import DataSource from "./pipelineDataSource.js"
import ActiveFilter from "./pipelineActiveFilter.js"
import DataSink from "./pipelineDataSink.js"
import PipesAndFiltersUtils from "./pipesAndFiltersUtils.js"
import * as constants from "./pipelineConstants.js"

export default class PassivePipeActiveFilter {
  
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
    
    this.activeFilter = new ActiveFilter(this.pipe1, this.pipe2);
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
        var dataSource = new DataSource(this.dataSource, this.pipe1)
        dataSource.pushToPipe(() => {
          this.updateView()
        })
              
        var dataSink = new DataSink(this.dataSink, this.pipe2)
        dataSink.getFromPipe(() => {
          this.updateView()
        })
              
        this.activeFilter.filter((object) => {
          
          object.setType(constants.Type.CIRCLE)
          object.setColor("color-blue", "object-square")
          
          return object
        }, () => {
          console.log("view: ", this.pipe2)
          this.updateView()
        }, this.context);
        
        
      }} >startActiveFilter</button>
          
      <button click={event => {
          this.activeFilter.stop()  
        
        }} >stopActivePipe</button>
    </div>
    return buttons
  }

  
}