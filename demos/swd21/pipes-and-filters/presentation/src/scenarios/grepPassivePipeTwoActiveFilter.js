import PipelineObject from "../components/pipelineObject.js"
import DataSource from "../components/pipelineDataSource.js"
import ActiveFilter from "../components/pipelineActiveFilter.js"
import PassivePipe from "../components/pipelinePassivePipe.js"
import DataSink from "../components/pipelineDataSink.js"
import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"
import * as constants from "../utils/pipelineConstants.js"

export default class GrepPassivePipeTwoActiveFilter {
  
  constructor(context, dataSourceLabels = null, pipe1Labels = null, filter1Labels = null, pipe2Labels = null, filter2Labels = null, pipe3Labels = null, filter3Labels = null, pipe4Labels = null, dataSinkLabels = null) {
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
    
    this.filter1 = {
      buffer: [],
      view: this.context.querySelector("#filter1"),
      label: this.context.querySelector("#filter1-label"),
      progress: this.context.querySelector("#filter1-progress")
    }
    
    this.filter2 = {
      buffer: [],
      view: this.context.querySelector("#filter2"),
      label: this.context.querySelector("#filter2-label"),
      progress: this.context.querySelector("#filter2-progress")
    }
    
    this.filter3 = {
      buffer: [],
      view: this.context.querySelector("#filter3"),
      label: this.context.querySelector("#filter3-label"),
      progress: this.context.querySelector("#filter3-progress")
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
    
    this.pipe3 = {
      buffer: [],
      view: this.context.querySelector("#pipe3"),
      label: this.context.querySelector("#pipe3-label")
    }
    
    this.pipe4 = {
      buffer: [],
      view: this.context.querySelector("#pipe4"),
      label: this.context.querySelector("#pipe4-label")
    }
    
    if (dataSourceLabels != null) {
      this.utils.setLabels(this.dataSource.label, dataSourceLabels)
    }
    if (pipe1Labels != null) {
      this.utils.setPipeLabels(this.pipe1.label, pipe1Labels)
    }
    if (filter1Labels != null) {
      this.utils.setLabels(this.filter1.label, filter1Labels)
    }
    if (pipe2Labels != null) {
      this.utils.setPipeVerticalLabels(this.pipe2.label, pipe2Labels)
    }
    if (filter2Labels != null) {
      this.utils.setLabels(this.filter2.label, filter2Labels)
    }
    if (pipe3Labels != null) {
      this.utils.setPipeLabels(this.pipe3.label, pipe3Labels)
    }
    if (filter3Labels != null) {
      this.utils.setLabels(this.filter3.label, filter3Labels)
    }
    if (pipe4Labels != null) {
      this.utils.setPipeVerticalLabels(this.pipe4.label, pipe4Labels)
    }
    if (dataSinkLabels != null) {
      this.utils.setLabels(this.dataSink.label, dataSinkLabels)
    }
    
    
    this.passivePipe1 = new PassivePipe(this.pipe1, -1)
    this.passivePipe2 = new PassivePipe(this.pipe2, -1)
    this.passivePipe3 = new PassivePipe(this.pipe3, -1)
    this.passivePipe4 = new PassivePipe(this.pipe4, -1)
    this.activeFilter1 = new ActiveFilter(this.passivePipe1, this.passivePipe2, this.filter1);
    this.activeFilter2 = new ActiveFilter(this.passivePipe2, this.passivePipe3, this.filter2);
    this.activeFilter3 = new ActiveFilter(this.passivePipe3, this.passivePipe4, this.filter3);
  }
  
  async updateView() {
    this.utils.drawObjects(this.dataSource)
    this.utils.drawObjects(this.pipe1)
    this.utils.drawFilterObject(this.filter1)
    this.utils.drawVerticalObjects(this.pipe2)
    this.utils.drawFilterObject(this.filter2)
    this.utils.drawObjects(this.pipe3)
    this.utils.drawFilterObject(this.filter3)
    this.utils.drawVerticalObjects(this.pipe4)
    this.utils.drawObjects(this.dataSink)
  }
  
  
  async buildButtons() {
    var buttons = <div>
      <button click={event => {
        var newObject = new PipelineObject();
        if (Math.floor(Math.random() * 100) < 30) {
          newObject.setType(constants.Type.CIRCLE)
          newObject.setColor(constants.Color.RED, constants.Type.CIRCLE)
        }
        this.dataSource.buffer.push(newObject)
        this.updateView()      
      }}>push</button>
      <button click={event => {
        
        let dataSourceObject = this.dataSource.buffer.shift()
        let pipe4Object = this.pipe4.buffer.shift()
        
        if(typeof pipe4Object !== "undefined") {
          this.dataSink.buffer.push(pipe4Object)
        }
              
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
              
        var dataSink = new DataSink(this.dataSink, this.pipe4)
        dataSink.getFromPipe(() => {
          this.updateView()
        })
              
        // FILTER 1
        this.activeFilter1.filter(async (object) => {
          await this.utils.animateFilter(
            this.filter1, 
            1000, 
            () => {
              if (object.type !== constants.Type.CIRCLE) {
                object = undefined
              }
            }
          )
          return object;
        }, () => {
          console.log("view: ", this.pipe2)
          this.updateView()
        }, this.context);
        
        // FILTER 2
        this.activeFilter2.filter(async (object) => {
          await this.utils.animateFilter(
            this.filter2, 
            2500, 
            () => {
              
              object.setType(constants.Type.SQUARE);
              object.setColor(object.color, object.type)
            }
          )
          return object;
        }, () => {
          console.log("view: ", this.pipe3)
          this.updateView()
        }, this.context);
              
        // FILTER 3
        this.activeFilter3.filter(async (object) => {
          await this.utils.animateFilter(
            this.filter3, 
            2500, 
            () => {
              if (object.color !== constants.Color.RED) {
                object = undefined
              }
            }
          )
          return object;
        }, () => {
          console.log("view: ", this.pipe4)
          this.updateView()
        }, this.context);
        
      }} >startActiveFilter</button>
          
      <button click={event => {
          this.activeFilter1.stop()  
          this.activeFilter2.stop()
          this.activeFilter3.stop()
        
        }} >stopActivePipe</button>
    </div>
    return buttons
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  
}