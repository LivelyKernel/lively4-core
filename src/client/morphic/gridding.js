
import {pt} from "src/client/graphics.js"


export default class Grid {
  static snap(value, gridSize, snapSize) {
    if (gridSize === undefined)
      gridSize = lively.preferences.get("gridSize");
    if (snapSize === undefined)
      snapSize = lively.preferences.get("snapSize");
  
  
    // #TODO make treatment of negative numbers easier while keping the [tests](test/graphics-test.js) green
    var rest = Math.abs(value % gridSize)
    if (value >  0 ) {
      if (Math.abs(gridSize - Math.abs(rest)) < snapSize) 
         return value - rest + gridSize
      if (rest < snapSize) 
        return value - rest;
    } else {
      if (Math.abs(gridSize - Math.abs(rest)) < snapSize) 
         return value + rest - gridSize
      if (rest < snapSize) 
        return value + rest;
    }
    return value
  }

  static snapPt(p, gridSize, snapSize) {
    return pt(this.snap(p.x, gridSize, snapSize), this.snap(p.y, gridSize, snapSize))
  }

  static optSnapPosition(pos, evt) {
    // snap if preference is "on" and 'alt' take the opposite
    if ((lively.preferences.get("SnapWindowsInGrid") && !evt.altKey) ||
        (!lively.preferences.get("SnapWindowsInGrid") && evt.altKey)) {
      return this.snapPt(pos)
    } else {
      return pos
    }
  }
} 