import PipelineObject from "../components/pipelineObject.js"
import DataSource from "../components/pipelineDataSource.js"
import ActiveFilterMultipleSinks from "../components/pipelineActiveFilterMultipleSinks.js"
import DataSink from "../components/pipelineDataSink.js"
import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"
import * as constants from "../utils/pipelineConstants.js"

export default class TPipeActiveFilter {
 
  constructor(context) {
    this.context = context
    this.utils = new PipesAndFiltersUtils()
    
    this.dataSource = {
      buffer: [],
      view: this.context.querySelector("#data-source")
    }
    
    this.dataSink1 = {
      buffer: [],
      view: this.context.querySelector("#data-sink1")
    }
  
    
    this.dataSink2 = {
      buffer: [],
      view: this.context.querySelector("#data-sink2")
    }
    
    this.filter = {
      buffer: [],
      view: this.context.querySelector("#filter")
    }
    
    this.pipe1 = {
      buffer: [],
      view: this.context.querySelector("#pipe1")
    }
    
    this.pipeToSink1 = {
      buffer: [],
      view: this.context.querySelector("#pipe2")
    }
    
    this.pipeToSink2 = {
      buffer: [],
      view: this.context.querySelector("#pipe3")
    }
    
    this.activeFilterIntoMultipleSinks = new ActiveFilterMultipleSinks(this.pipe1, this.pipeToSink1, this.pipeToSink2, this.filter);
  }
  
  
  
   async updateView() {
     
    this.utils.drawObjects(this.dataSource)
    this.utils.drawObjects(this.pipe1)
    this.utils.drawObjects(this.filter)
    this.utils.drawObjects(this.pipeToSink1)
    this.utils.drawVerticalObjects(this.pipeToSink2)
    this.utils.drawObjects(this.dataSink1)
    this.utils.drawObjects(this.dataSink2)
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
              
        var dataSink1 = new DataSink(this.dataSink1, this.pipeToSink1)
        dataSink1.getFromPipe(() => {
          this.updateView()
        })
              
                            
        var dataSink2 = new DataSink(this.dataSink2, this.pipeToSink2)
        dataSink2.getFromPipe(() => {
          this.updateView()
        })
        
        
        this.activeFilterIntoMultipleSinks.filter(async (object) => {
          await this.sleep(2500)

          var color = object.color
          if (color.includes("red") || color.includes("yellow") ) {
            return true
          }
          
          return false
        }, () => {
          this.updateView()
        });
        
        
      }}>startActiveFilter</button>
          
      <button click={event => {
          this.activeFilter.stop()  
        
        }} >stopActivePipe</button>
    </div>
    return buttons
  }
  
   sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  

}