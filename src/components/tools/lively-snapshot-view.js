"enable examples";

import Morph from 'src/components/widgets/lively-morph.js';

export class /*instance:*/Dummy/*{"id":"9790_7210_cfda","name":{"mode":"input","value":"D"},"values":{}}*/ {
  
  /*example:*/heho/*{"id":"028d_0195_f91b","name":{"mode":"input","value":""},"color":"hsl(270, 30%, 70%)","values":{},"instanceId":{"mode":"select","value":"9790_7210_cfda"},"prescript":"","postscript":""}*/() {
    
    var s = "Hello World"
    /*probe:*/s/*{}*/

    var canvas = <canvas height="100" width="200"></canvas>
    var ctx = canvas.getContext("2d")

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 100, 100)

   
    
    ctx.fillStyle = "red"
    ctx.fillRect(20, 20, 60, 60)
    
    var image = ctx.getImageData(0,0, 100, 100)
    
    /*probe:*/image/*{}*/
    
    /*probe:*/ctx/*{}*/
  }
  
}

export default class LivelySnapshotView extends Morph {
  async initialize() {
    this.windowTitle = "Snapshot View";
    
  }
 
  
  get value() {
    return this.snapshot && this.snapshot.value
  }

  get type() {
    return this.snapshot && this.snapshot.type
  }

  set examples(examples) {
    this._examples = examples
    this.snapshot = Object.values(this._examples)[0][0].after
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
    this.snapshot = other.snapshot
  }

  

  async livelyExample1() {
   this.snapshot = {
     type: "String",
     value: "Hello World"
   }
  }
  
  async /*example:*/livelyExample/*{"id":"4575_d9a9_a430","name":{"mode":"input","value":""},"color":"hsl(350, 30%, 70%)","values":{},"instanceId":{"mode":"select","value":"9c2a_2cdc_e405"},"prescript":"","postscript":""}*/() {
    var canvas = <canvas  width="200" height="100"></canvas>
    var ctx = canvas.getContext("2d")
    
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 100, 100)
    
    /*probe:*/ctx.constructor.name/*{}*/
    
    ctx.fillStyle = "blue"
    /*probe:*/ctx/*{}*/.fillRect(5, 5, 60, 60)
    
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
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[{"id":"9c2a_2cdc_e405","name":"SnapshotView","code":"return lively.create(\"lively-snapshot-view\");"}]} */