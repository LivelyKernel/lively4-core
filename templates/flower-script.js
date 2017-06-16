import Morph from "./Morph.js"
import boundEval from "src/client/bound-eval.js"
import Window from "./lively-window.js"
import {pt} from "src/client/graphics.js" 
import DragBehavior from "src/client/morphic/dragbehavior.js"

export default class FlowerScript extends Morph {

  get isFlowerNode() {
    return true
  }

  initialize() {
    this.windowTitle = "Flower Script"
    this.get("#editor").doSave = () => { this.execute()}
    this.value = this.getAttribute("value")
    
    this.classList.add("lively-content")
    DragBehavior.on(this)
  }
  

  
  toString() {
    return "[FlowerScript]"
  }
  
  get value() {
    return this.get("#editor").value
  }
  
  set value(s) {
    this.get("#editor").value = s
  }
  
  update() {
    this.execute()
  }
  
  async execute() {
    var input = this.input
    this.get("#input").content = input
    
    // lively.notify("eval " + this.value + " with " + input)
    var result = await boundEval(";" + this.value); 
    // #Hack due to bug in bound eval... "a string" is not a program, but a directive, so we make it program
    if (result.isError) {
      lively.showError(result.value)
    }

    // ok, this got more complicated then I thought
    if (result.value instanceof Function) {
      try {
        result = result.value.apply(this, input)
      } catch(e) {
        lively.showError(e)
      }
      if (result && result.then) {
        this.output = await result
      } else {
        this.output = result
      }
    } else {
      this.output = result.value
    }
  }

  // #TODO, hook dataflow in here
  get input() {
    return this.inputDependencies().map(ea => ea.output)  
    // return this._input
  }

  // set input(v) {
  //   return this._input = v
  // }

  get output() {
    return this._output
  }
  
  set output(v) {
    this.get("#output").content = v
    this._output = v
    this.outputDependents().forEach(ea => ea.update())  
  }

  inputDependencies() {
    var bounds =lively.getGlobalBounds(this).insetBy(-40)
    return this.flowerNodes().filter( ea => {
      if (ea === this) return false
      return bounds.containsPoint(lively.getGlobalBounds(ea).bottomCenter())
    })
  }
  
  outputDependents() {
    var p = lively.getGlobalBounds(this).bottomCenter()
    return this.flowerNodes().filter( ea => {
      if (ea === this) return false
      return lively.getGlobalBounds(ea).insetBy(-30).containsPoint(p)
    })
  }
  
  flowerNodes() {
    return lively.array(this.world().querySelectorAll("*")).filter(ea => ea.isFlowerNode)
  }

  world() {
    if (this.parentElement && this.parentElement.isWindow)
      return this.parentElement.parentElement
    else
      return this.parentElement
  }

  snapToOtputDependents() {
    var other = this.outputDependents()[0]
    if (!other) return;
    var offsetY = lively.getGlobalBounds(other).top() - lively.getGlobalBounds(this).bottom()
    lively.moveBy(this, pt(0,offsetY))
  }

  snapToInputDependencies() {
    var other = this.inputDependencies()[0]
    if (!other) return;
    var offsetY = lively.getGlobalBounds(other).bottom() - lively.getGlobalBounds(this).top()
    lively.moveBy(this, pt(0,offsetY))
  }


  livelyPreMigrate() {
    this.setAttribute("value", this.value)
  }
  
  livelyMigrate(oldInstance) {
    this.value = oldInstance.value
  }

}