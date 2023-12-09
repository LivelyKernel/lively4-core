

import Morph from 'src/components/widgets/lively-morph.js';
import BabylonianManager from "src/babylonian-programming-editor/worker/babylonian-manager.js";

export class Dummy {
  
  heho() {
    
    var s = "Hello World"
    s

    var canvas = <canvas height="100" width="200"></canvas>
    var ctx = canvas.getContext("2d")

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 100, 100)

    ctx.fillStyle = "red"
    ctx.fillRect(20, 20, 60, 60)
    
    var image = ctx.getImageData(0,0, 100, 100)
    
    image
    
    ctx
  }
}

export default class LivelySnapshotView extends Morph {
  async initialize() {
    this.windowTitle = "Snapshot View";
    this._activeExamples = [] 
    
    this.get('#examples').addEventListener("change", evt => this.onExampleChanged(evt))
    this.get('#values').addEventListener("change", evt => this.onExampleChanged(evt))
    this.get('#values').addEventListener("change", evt => this.onExampleChanged(evt))
    this.get('#values').addEventListener("input", evt => this.onExampleChanged(evt))
  }
  
  connectedCallback() {
    // super.connectedCallback()
    BabylonianManager.registerEditor(this);
  }

  disconnectedCallback() {
    // super.disconnectedCallback()
    BabylonianManager.unregisterEditor(this);
  }
  
  
  // #Refactor good bad example for law of demeter... this is actually to much :-) 
  // why does it look the way it looks... I am still discovering the code base...
  // #TODO we need a figure here
  // - BabylonianManager 
  // - BabylonianEditor - CodeMirror
  // - Probe - ProbeWidget
  // - Node
  // - exampleIds - nodeIds 
  // - Example - Runs -  Values
  onTrackerChanged() {
    if (!this.examples) return
    var firstExample = Object.values(this.examples)[0]
    
    if (!firstExample) {
      lively.warn("no examples found")
      return
    }
    
    var exampleId = firstExample.id // not usefull
    
    /*MD see <edit://src/babylonian-programming-editor/babylonian-programming-editor.js#updateAnnotations> MD*/
    if (!firstExample.probe) {
      // no probe to observe...
      return 
    }
    
    var node = firstExample.probe.babylonianEditor.nodeForAnnotation(firstExample.probe);
    if (!node) { 
      lively.notify("no node found for probe")
      return 
    }
    let id = node._id
    lively.notify("looking for example of id=" + id)
    
    if(BabylonianManager.tracker.ids.has(id)) { 
      // this is so uggly!!! sorry!
      var myTrackedExamples = BabylonianManager.tracker.ids.get(id)
      let activeExamples = Array.from(BabylonianManager.activeExamples);
      let myExamples = activeExamples.filter((e) => myTrackedExamples.has(e.id))
      var inspectorValue = firstExample.probe._widget.inspectorValue(myExamples);
      this.examples = inspectorValue
    } else {
      lively.notify("nothing found")
      
    }
  }
  
  
  onExampleChanged(evt) {
    var exampleId = this.get("#examples").value  
    var valueKey = this.get("#values").value 
    this.updateExampleAndValue(exampleId, valueKey)
  }
  

  get value() {
    return this.snapshot && this.snapshot.value
  }

  get type() {
    return this.snapshot && this.snapshot.type
  }

  get examples() {
    return this._examples
  }

  get exampleId() {
     return this.get("#examples").value
  }
  
  set exampleId(id) {
     this.get("#examples").value = id
  }
  
  get valueIndex() {
    return this.get("#values").value
  } 
  
  set valueIndex(index) {
    this.get("#values").value  = index
  } 
  
  
  set examples(namedExamples) {
    
    
    this._examples = namedExamples
    // #TODO how to write this better
    if (this._examples) {
      var exampleId = this.exampleId
      var example = this._examples[exampleId]
      
      
      var examples = Object.values(this._examples)
      var exampleIds = Object.keys(this._examples)
      this.get("#examples").setOptions(exampleIds)
      
      if (!example) {
        var exampleKey = 0
        example = examples[exampleKey]   
        exampleId = exampleIds[exampleKey]
        this.exampleId= exampleId
      } 
      
      if (example.values) {
        var index = this.valueIndex
        var last = example.values.length - 1
        if (index > last) {
          index = last
        }
        this.get("#values").setAttribute("max", last)
        this.valueIndex = index
        this.updateExampleAndValue(exampleId, index)
      }      
    }
  }
  
  updateExampleAndValue(exampleId, valueKey) {
    var example = this._examples[exampleId]   
    var value = example.values[valueKey]
    this.snapshot = value.after // only show state after first run..
  }
  
  
  
  get activeExamples() {
    return this._activeExamples
  }
  

  set snapshot(data) {
    this._snapshot = data
    this.updateView()
  }
  
  get snapshot() {
    return this._snapshot
  }

  clear() {
    this.get("#content").innerHTML = ""
  }
  
  renderCanvasRenderingContext2D() {
    this.renderImageData()
  }
  
  
  renderString() {
     this.get("#content").textContent = this.value
  }
  
  async renderImageData() {
    if (!(this.value instanceof ImageData)) {
      return this.renderObject()
    }
    
    this.contentRoot.appendChild(<h3>{this.type}</h3>)
     this.contentRoot.appendChild(<div>width={this.value.width} height={this.value.height}</div>)
    
    var canvas = await (<canvas width={this.value.width}  height={this.value.height}></canvas>)
    canvas.style.border = "1px solid gray"
    var ctx = canvas.getContext("2d")
    ctx.putImageData(this.value, 0 , 0)
    
    this.contentRoot.appendChild(canvas)
    
  }
  
  
  async renderObject() {
    var inspector = await (<lively-inspector type="snapshot"></lively-inspector>)
    inspector.inspect(this.value)
    
    this.contentRoot.appendChild(inspector)
  }

  
  
  get contentRoot() {
    return this.get("#content")
  }
  
  
  async updateView() {
    // in SWA we would propose double dispatch, here... but in JavaScript we want to avoid
    // polutting the namespace of system classes...
    // so we do it only in custom cases and dispatch to ourself for the rest
    this.clear()
    if (this.value && this.value.livelySnapshotView) {
      this.value.livelySnapshotView(this)
    } else {
      var renderMethodName = "render" + this.type
      if (this[renderMethodName]) {
        await this[renderMethodName]()
      } else {
        this.renderObject()
      }      
    }
    
  }

  livelyMigrate(other) {
    this.examples = other.examples
    // this.snapshot = other.snapshot
  } 

  async livelyExample1() {
   this.snapshot = {
     type: "String",
     value: "Hello World"
   }
  }
  
  async livelyExample() {
    var canvas = <canvas  width="200" height="100"></canvas>
    var ctx = canvas.getContext("2d")
    
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 100, 100)
    
    ctx.constructor.name
    
    ctx.fillStyle = "blue"
    ctx.fillRect(5, 5, 60, 60)
    
//    var imageData = ctx.getImageData(0,0, canvas.width, canvas.height)
  var imageData = ctx.getImageData(0,0, 90, 50)
  
    this.snapshot = {
      type: "CanvasRenderingContext2D",
      value: imageData
    }
    
    // this.snapshot = {
    //  type: "ImageData",
    //  value: image
    // }
  }
  
  async livelyExample3() {
    this.snapshot = {
    type: "Object",
      value: {
        foo: "hello",
          sub: {
            name: "other"
          }
       }
     }
   }
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[{"id":"9c2a_2cdc_e405","name":"SnapshotView","code":"return lively.create(\"lively-snapshot-view\");"}]} *//* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */