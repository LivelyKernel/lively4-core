import PipelineObject from "../components/pipelineObject.js"
import DataSource from "../components/pipelineDataSource.js"
import ActiveFilter from "../components/pipelineActiveFilter.js"
import PassivePipe from "../components/pipelinePassivePipe.js"
import DataSink from "../components/pipelineDataSink.js"
import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"
import * as constants from "../utils/pipelineConstants.js"

export default class ModularActiveFilterPassivePipe {
  
  constructor(context, dataSourceLabels = null, pipe1Labels = null, filter1Labels = null, pipe2Labels = null, filter2Labels = null, pipe3Labels = null, dataSinkLabels = null) {
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
      progress: this.context.querySelector("#filter1-progress"),
      currentObject: "object-square"
    }
    
    this.filter2 = {
      buffer: [],
      view: this.context.querySelector("#filter2"),
      label: this.context.querySelector("#filter2-label"),
      progress: this.context.querySelector("#filter2-progress"),
      currentColor: "color-green"
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
    if (dataSinkLabels != null) {
      this.utils.setLabels(this.dataSink.label, dataSinkLabels)
    }
    
    this.passivePipe1 = new PassivePipe(this.pipe1, 4)
    this.passivePipe2 = new PassivePipe(this.pipe2, 2)
    this.passivePipe3 = new PassivePipe(this.pipe3, 2)
    this.activeFilter1 = new ActiveFilter(this.passivePipe1, this.passivePipe2, this.filter1);
    this.activeFilter2 = new ActiveFilter(this.passivePipe2, this.passivePipe3, this.filter2);
  }
  
  async updateView() {
    this.utils.drawObjects(this.dataSource)
    this.utils.drawObjects(this.pipe1)
    this.utils.drawFilterObject(this.filter1)
    this.utils.drawVerticalObjects(this.pipe2)
    this.utils.drawFilterObject(this.filter2)
    this.utils.drawObjects(this.pipe3)
    this.utils.drawObjects(this.dataSink)
  }
  
  async addFormListener() {
    
  }
  
  async buildButtons() {
    var buttons = <div>
      <button click={event => {
        this.dataSource.buffer.push(new PipelineObject())
        this.updateView()      
      }}>push</button>
      <button click={event => {
        
        let dataSourceObject = this.dataSource.buffer.shift()
        let pipe3Object = this.pipe3.buffer.shift()
        
        if(typeof pipe3Object !== "undefined") {
          this.dataSink.buffer.push(pipe3Object)
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
              
        var dataSink = new DataSink(this.dataSink, this.pipe3)
        dataSink.getFromPipe(() => {
          this.updateView()
        })
              
        this.activeFilter1.filter(async (object) => {
          await this.utils.animateFilter(
            this.filter1, 
            1000, 
            () => {
              object.setType(this.filter1.currentObject)
              object.setColor(object.color, this.filter1.currentObject)
            }
          )
          return object;
        }, () => {
          console.log("view: ", this.pipe2)
          this.updateView()
        }, this.context);
        
        this.activeFilter2.filter(async (object) => {
          await this.utils.animateFilter(
            this.filter2, 
            2500, 
            () => {
              object.setType(object.type)
              object.setColor(this.filter2.currentColor, object.type)
            }
          )
          return object;
        }, () => {
          console.log("view: ", this.pipe3)
          this.updateView()
        }, this.context);
        
      }} >startActiveFilter</button>
          
      <button click={event => {
          this.activeFilter1.stop()  
          this.activeFilter2.stop()
        
        }} >stopActivePipe</button>
    </div>
        
    var radioGroup1 = this.context.querySelector("#form-object")
        
    var radioGroup2 = this.context.querySelector("#form-color")
    
      radioGroup2.addEventListener("change", () => {
        this.filter2.currentColor = radioGroup2.querySelector('input[name="color"]:checked').value;
      })

      radioGroup1.addEventListener("change", () => {
        this.filter1.currentObject = radioGroup1.querySelector('input[name="object"]:checked').value;
      })
    
    return buttons
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  
}