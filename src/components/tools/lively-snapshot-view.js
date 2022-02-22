"enable examples";

import Morph from 'src/components/widgets/lively-morph.js';
import BabylonianWorker from "src/babylonian-programming-editor/worker/babylonian-worker.js";

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
  }
  
  attachedCallback() {
    // super.attachedCallback()
    BabylonianWorker.registerEditor(this);
  }

  detachedCallback() {
    // super.detachedCallback()
    BabylonianWorker.unregisterEditor(this);
  }
  
  
  // #Refactor good bad example for law of demeter... this is actually to much :-) 
  // why does it look the way it looks... I am still discovering the code base...
  // #TODO we need a figure here
  // - BabylonianWorker 
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
    
    if(BabylonianWorker.tracker.ids.has(id)) { 
      // this is so uggly!!! sorry!
      var myTrackedExamples = BabylonianWorker.tracker.ids.get(id)
      let activeExamples = Array.from(BabylonianWorker.activeExamples);
      let myExamples = activeExamples.filter((e) => myTrackedExamples.has(e.id))
      var inspectorValue = firstExample.probe._widget.inspectorValue(myExamples);
      this.examples = inspectorValue
    } else {
      lively.notify("nothing found")
      
    }
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

  set examples(examples) {
    
    this._examples = examples
    let firstExample = Object.values(this._examples)[0] // #TODO show all of them?
    if (firstExample.values) {
      this.snapshot = firstExample.values[0].after // only show state after first run..
    } else {
      this.snapshot = {
        after: "NOTHING TO SEE HERE"
      }
    }
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
    var inspector = await (<lively-inspector></lively-inspector>)
    inspector.inspect(this.value)
    
    this.contentRoot.appendChild(inspector)
  }

  
  
  get contentRoot() {
    return this.get("#content")
  }
  
  
  async updateView() {
    // in SWA we would propose double dispatch, here... but in JavaScript we want to avoid
    // polutting the namespace of system classes...
    // so we dispatch to ourself...
    this.clear()
    var renderMethodName = "render" + this.type
    if (this[renderMethodName]) {
      await this[renderMethodName]()
    } else {
      this.renderObject()
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