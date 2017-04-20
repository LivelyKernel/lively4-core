import Relax from "src/external/relax.js"
import {RelaxNode} from "src/external/relax.js"
import Windows from "templates/lively-window.js"
import {pt, rects, Intersection} from "src/client/graphics.js"

export default class RelaxWindows {
  
  static relax() {
    // var windows  = Windows.allWindows()
    
    var windows = lively.array(that.childNodes)
    var solver = new Relax()
    
    /* make active solver variables */
    windows.forEach((ea, i) => {
      Object.defineProperty(solver.vars, 'window_'+i +"_x", {
        get: function() { return lively.getGlobalPosition(ea).x },
        set: function(newValue) { 
          console.log("set " +i + " x =" + newValue)
          lively.setGlobalPosition(ea, pt(newValue, lively.getGlobalPosition(ea).y)) },
        enumerable: true
      })
      Object.defineProperty(solver.vars, 'window_'+i +"_y", {
        get: function() { return lively.getGlobalPosition(ea).y },
        set: function(newValue) { 
          console.log("set " +i + " y =" + newValue)
          lively.setGlobalPosition(ea, pt(lively.getGlobalPosition(ea).x, newValue)) },
        enumerable: true
      })
    })
    
    
    window.moveWindowsFunction = () => {
      var rects = windows.map(ea => lively.getGlobalBounds(ea))
      var intersections = Intersection.rects(rects)
      // intersections.forEach( ea => lively.showRect(ea.topLeft(), ea.extent()))
      return intersections.reduce((sum, ea) => sum + Math.abs(ea.width * ea.height), 0)
    }
    
    var reduceOverlapCn = new RelaxNode('window.moveWindowsFunction()', Object.keys(solver.vars), solver)
    solver.addConstraint(reduceOverlapCn)
    //solver.longWaitMillis = 10000000000000
    solver.solve()
  }
}
