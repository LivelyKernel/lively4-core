import PipelineObject from "../components/pipelineObject.js"
import DataSource from "../components/pipelineDataSource.js"
import ActiveFilter from "../components/pipelineActiveFilter.js"
import PassivePipe from "../components/pipelinePassivePipe.js"
import DataSink from "../components/pipelineDataSink.js"
import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"
import * as constants from "../utils/pipelineConstants.js"

export default class PassivePipeActiveFilter {
  
  constructor(context, dataSourceLabels = null, pipe1Labels = null, filterLabels = null, pipe2Labels = null, dataSinkLabels = null) {
    this.context = context
    
    this.utils = new PipesAndFiltersUtils()
    this.dataSource = {
      buffer: [],
      view: this.context.querySelector("#data-source"),
      label: this.context.querySelector("#data-source-label")
    }
    
    this.dataSink = {
      buffer: [],
      view: this.context.querySelector("#data-sink"),
      label: this.context.querySelector("#data-sink-label")
    }
    
    this.filter = {
      buffer: [],
      view: this.context.querySelector("#filter"),
      label: this.context.querySelector("#filter-label"),
      progress: this.context.querySelector("#filter-progress")
    }
    
    this.pipe1 = {
      buffer: [],
      view: this.context.querySelector("#pipe1"),
      label: this.context.querySelector("#pipe1-label")
    }
    
    this.pipe2 = {
      buffer: [],
      view: this.context.querySelector("#pipe2"),
      label: this.context.querySelector("#pipe2-label")
    } 
    
    if (dataSourceLabels != null) {
      this.utils.setLabels(this.dataSource.label, dataSourceLabels)
    }
    if (pipe1Labels != null) {
      this.utils.setPipeLabels(this.pipe1.label, pipe1Labels)
    }
    if (filterLabels != null) {
      this.utils.setLabels(this.filter.label, filterLabels)
    }
    if (pipe2Labels != null) {
      this.utils.setPipeLabels(this.pipe2.label, pipe2Labels)
    }
    if (dataSinkLabels != null) {
      this.utils.setLabels(this.dataSink.label, dataSinkLabels)
    }
    
    this.passivePipe1 = new PassivePipe(this.pipe1, -1)
    this.passivePipe2 = new PassivePipe(this.pipe2, -1)
    this.activeFilter = new ActiveFilter(this.passivePipe1, this.passivePipe2, this.filter);
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
        var dataSource = new DataSource(this.dataSource, this.passivePipe1)
        dataSource.pushToPipe(() => {
          this.updateView()
        })
              
        var dataSink = new DataSink(this.dataSink, this.pipe2)
        dataSink.getFromPipe(() => {
          this.updateView()
        })
        
        this.activeFilter.filter(async (object) => {
          await this.utils.animateFilter(
            this.filter, 
            2000, 
            () => {
              object.setColor(constants.Color.BLUE, object.type);
            }
          )
          return object;
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