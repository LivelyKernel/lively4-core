import PipelineObject from "../components/pipelineObject.js"
import DataSource from "../components/pipelineDataSource.js"
import ActiveFilter from "../components/pipelineActiveFilter.js"
import DataSink from "../components/pipelineDataSink.js"
import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js"
import * as constants from "../utils/pipelineConstants.js"

export default class ModularActiveFilterPassivePipe {
  
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
    
    this.filter1 = {
      buffer: [],
      view: this.context.querySelector("#filter1"),
      currentObject: "object-square"
    }
    
    this.filter2 = {
      buffer: [],
      view: this.context.querySelector("#filter2"),
      currentColor: "color-green"
    }
    
    this.pipe1 = {
      buffer: [],
      view: this.context.querySelector("#pipe1")
    }
    
    this.pipe2 = {
      buffer: [],
      view: this.context.querySelector("#pipe2")
    }
    
    this.pipe3 = {
      buffer: [],
      view: this.context.querySelector("#pipe3")
    }
    
    this.activeFilter1 = new ActiveFilter(this.pipe1, this.pipe2, this.filter1);
    this.activeFilter2 = new ActiveFilter(this.pipe2, this.pipe3, this.filter2);
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
        var dataSource = new DataSource(this.dataSource, this.pipe1)
        dataSource.pushToPipe(() => {
          this.updateView()
        })
              
        var dataSink = new DataSink(this.dataSink, this.pipe3)
        dataSink.getFromPipe(() => {
          this.updateView()
        })
              
        this.activeFilter1.filter(async (object) => {
          await this.sleep(1000)
          object.setType(this.filter1.currentObject)
          object.setColor(object.color, this.filter1.currentObject)
          return object
        }, () => {
          console.log("view: ", this.pipe2)
          this.updateView()
        }, this.context);
        
        this.activeFilter2.filter(async (object) => {
          await this.sleep(2500)
          object.setType(object.type)
          object.setColor(this.filter2.currentColor, object.type)
          return object
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
        
    var radioGroups = <div style="display: flex;"></div>
        
    var radioGroup1 = <form id="form-object">
          <p>Filter 1:</p>
          <div>
            <input type="radio" id="rb-square" name="object" value="object-square" checked></input>
            <label for="rb-square">square</label>
          </div>
          <div>
            <input type="radio" id="rb-circle" name="object" value="object-circle"></input>
            <label for="rb-circle">circle</label>
          </div>
          <div>
            <input type="radio" id="rb-triangle" name="object" value="object-triangle"></input>
            <label for="rb-triangle">triangle</label>
          </div>
        </form>
        
    var radioGroup2 = <form id="form-color">
          <p>Filter 2:</p>
          <div>
            <input type="radio" id="rb-green" name="color" value="color-green" checked></input>
            <label for="rb-green">green</label>
          </div>
          <div>
            <input type="radio" id="rb-red" name="color" value="color-red"></input>
            <label for="rb-red">red</label>
          </div>
          <div>
            <input type="radio" id="rb-blue" name="color" value="color-blue"></input>
            <label for="rb-blue">blue</label>
          </div>
          <div>
            <input type="radio" id="rb-yellow" name="color" value="color-yellow"></input>
            <label for="rb-yellow">yellow</label>
          </div>
        </form>
    
    radioGroups.append(radioGroup1)
    radioGroups.append(radioGroup2)
    buttons.append(radioGroups)
    
    
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