import PipelineObject from "../components/pipelineObject.js"
import DataSource from "../components/pipelineDataSource.js"
import ActivePipe from "../components/pipelineActivePipe.js"
import PassiveFilter from "../components/pipelinePassiveFilter.js"
import DataSink from "../components/pipelineDataSink.js"
import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"
import * as constants from "../utils/pipelineConstants.js"

export default class ActivePipePassiveFilter {
  
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
      bufferInput: [],
      bufferOutput: [],
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
    
    this.passiveFilter = new PassiveFilter(this.filter);
    this.activePipe1 = new ActivePipe(this.dataSource, this.pipe1, this.passiveFilter, 2);
    this.activePipe2 = new ActivePipe(this.passiveFilter, this.pipe2, this.dataSink, 2);
    
    this.whileCondition = true;
  }
  
  async updateView() {
    this.utils.drawObjects(this.dataSource)
    this.utils.drawObjects(this.pipe1)
    this.utils.drawPassiveFilterObject(this.filter)
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
        let filterObject = this.filter.bufferInput.shift()
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
        
        /*
        var dataSource = new DataSource(this.dataSource, this.pipe1)
        dataSource.pushToPipe(() => {
          this.updateView()
        })
        
              
        var dataSink = new DataSink(this.dataSink, this.pipe2)
        dataSink.getFromPipe(() => {
          this.updateView()
        })
        */
              
        //var activePipe = new ActivePipe(this.pipe1, this.pipe2)
        this.activePipe1.pipeActive(async (object1) => {
          return await this.passiveFilter.filter(async (object2) => {
            await this.utils.animateFilter(
              this.filter, 
              2500, 
              () => {
                if (!object2.color.includes("red")) {
                  object2 = undefined;
                }
              }
            )
            return object2;
          }, () => {
            this.updateView();
          })
        }, () => {
          this.updateView()
        });
              
              
        this.activePipe2.pipeActive(
          async (object) => {
            return object;
          }, 
          () => {
            this.updateView();
          }
        );
        
        
      }} >startActivePipe</button>
          
      <button click={event => {
          this.activePipe1.stop()
          this.activePipe2.stop()    
        
        }} >stopActivePipe</button>

    </div>
    return buttons
  }
 
  pushNdata(component, n) {
    for (let i = 0; i < n; i++) {
      component.buffer.push(new PipelineObject());
    }
    
  }

  
  async animateDryRunForPipelineDemonstartion() {
    this.pushNdata(this.dataSource, 20)
    
    if(!this.hasAnyUnprocessedItem()) {
     this.pushNdata(this.dataSource, 20) 
    }
    
    while(true) { // while in body still not working
          
      let dataSourceElement = this.dataSource.buffer.shift()
      
      let pipe1Element = undefined;
      if (this.pipe1.buffer.length > 2 || dataSourceElement === undefined) {
        pipe1Element = this.pipe1.buffer.shift()
      }
      
      let filterElement = this.filter.bufferInput.shift()
      
      
      let pipe2Element = undefined;
      if (this.pipe2.buffer.length > 2 || filterElement === undefined) {
        pipe2Element = this.pipe2.buffer.shift()

      }
        
      dataSourceElement != undefined ? this.pipe1.buffer.push(dataSourceElement) : false;
      pipe1Element != undefined ? this.filter.bufferInput.push(pipe1Element) : false;
      
      // filter removes all triangle objects
      if (filterElement != undefined) {
        !filterElement.color.includes("triangle") ? this.pipe2.buffer.push(filterElement) : false
      }
      
      pipe2Element != undefined ? this.dataSink.buffer.push(pipe2Element) : false;
      
      await this.updateView()     
          
      await this.sleep(1000)
      
      if(!this.hasAnyUnprocessedItem()) {
        this.dataSink.buffer = []
        this.pushNdata(this.dataSource, 20)
        await this.updateView
      }
      
    }

    
  }

 sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  hasAnyUnprocessedItem() {
    if (this.dataSource.buffer.length > 0 || this.pipe1.buffer.length > 0 || this.filter.bufferInput.length > 0 || this.pipe2.buffer.length > 0 ) {
      return true;
    
    }
    return false
    
  }
}