/*
 * A little visualization of lines stored in workspace variables
 * - it continously visualizes them
 * Challenges:
 * - What about scales and offsets?
 * - what about non global variables?
 */
import {getScopeIdForModule} from "src/external/babel-plugin-var-recorder.js"

class VariableVis {
  
  static start() {
    this.isRunning = true
    this.step()
  }

  static stop() {
    this.isRunning = false
  }

  
  static step() {
    if (!this.isRunning) return;
    setTimeout(() => this.step(), 100)    
    this.update()
  }
  
  
 static update() {
    var variables = _recorder_[getScopeIdForModule()]
    Object.keys(variables).forEach(ea => {
      var value = variables[ea]
      if (value instanceof Array && value.length == 2) {
        if (value[0].isPoint && value[1].isPoint) {
          var name = "debug_variable_"+ea
          var path = document.body.querySelector("#" + name)
          if (path) path.remove();      
          var vector = lively.createPath(value, "blue", true, ea)
          vector.id = name
          document.body.appendChild(vector)                                     
        }
      }
    })    
  }
}

VariableVis.start()


