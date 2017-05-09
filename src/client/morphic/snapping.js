import {pt} from "src/client/graphics.js"

export class Grid {
  static snapAllTopLevelContent() {
    var  gridSize = lively.preferences.get("gridSize") || 100;
    lively.array(document.body.querySelectorAll(":scope > *"))
      .filter(ea => ea.classList.contains("lively-content") || ea.isWindow)
      .forEach( ea => {
        var pos = lively.getPosition(ea)
        lively.setPosition(ea, 
          pt(Grid.snap(pos.x, gridSize, gridSize / 2), Grid.snap(pos.y,  gridSize, gridSize / 2)))
      })
  }
  
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

export default class Snapping {

  static snapTo(target) {
    var snapping = new Snapping(target)
    snapping.snap()
  }
  
  constructor(target) {
    this.target = target
    this.helpers = []
    this.snapDistance = 5
  }

  snap() {
    var padding = lively.preferences.get("SnapPaddingSize")
    this.clearHelpers()
    this.snapTo("left", "left")

    this.snapTo("left", "right")
    this.snapTo("left", "right", padding)

    this.snapTo("left", "centerX")
    

    this.snapTo("top", "top")
    this.snapTo("top", "bottom")
    this.snapTo("top", "bottom", padding)

    this.snapTo("top", "centerY")
    


    this.snapTo("right", "right")
    this.snapTo("right", "left")
    this.snapTo("right", "left", -padding)

    this.snapTo("right", "centerX")

    
    this.snapTo("bottom", "bottom")
    this.snapTo("bottom", "top")
    this.snapTo("bottom", "top", -padding)

    this.snapTo("bottom", "centerY")

  }

  snapBounds(corner) {
    // #TODO for find an alorithm that computes all the existing paddings in the world and use them here, so that it works like in PowerPoint and others
    var padding = lively.preferences.get("SnapPaddingSize")
    this.clearHelpers()
    // #TODO implement snapping to changing top, left when there is a UI for it
    this.snapToExtent("right", "right")
    this.snapToExtent("right", "left")
    this.snapToExtent("right", "left", -padding)
    this.snapToExtent("right", "centerX")


    this.snapToExtent("bottom", "bottom")
    this.snapToExtent("bottom", "top")
    this.snapToExtent("bottom", "top", -padding)

    this.snapToExtent("bottom", "centerY")

  }

  get all() {
    if (!this._all) {
      this._all = lively.array(this.target.parentElement.querySelectorAll(":scope > *"))
        .filter(ea => (ea !== this.target) && ea.classList.contains("lively-content"));
    }
    return this._all
  }

  showHelpers(snap, snapped, isHorizontal) {
    Object.keys(snap)
      .filter(ea => ea  == snapped)
      .forEach( ea => {
        this.helpers = this.helpers.concat(
          snap[ea].map(eaElement => {
            var line;
            var parentPos = lively.getGlobalPosition(this.target.parentElement)
            if (isHorizontal) {
              let globalY = Number(ea) + parentPos.y 
              lively.notify("globalY " + parentPos.y)
              let minLeft = Math.min(
                  lively.getGlobalBounds(eaElement).left(),
                  lively.getGlobalBounds(this.target).left())
              let maxRight = Math.max(
                  lively.getGlobalBounds(eaElement).right(),
                  lively.getGlobalBounds(this.target).right()) 
              line = [pt(minLeft, globalY), pt(maxRight, globalY)]
            } else {
              let globalX = Number(ea) + parentPos.x 
              let minTop = Math.min(
                  lively.getGlobalBounds(eaElement).top(),
                  lively.getGlobalBounds(this.target).top())
              let maxBottom = Math.max(
                  lively.getGlobalBounds(eaElement).bottom(),
                  lively.getGlobalBounds(this.target).bottom());
              line = [pt(globalX, minTop), pt(globalX, maxBottom)]
            }
            return lively.showPath(line, "rgba(80,180,80,0.8)", false)
          }));
          
        // this.helpers = this.helpers.concat(
        //   snap[ea].map(eaElement => {
        //     return lively.showElement(eaElement) }))
      })
  }

  clearHelpers() {
    if (this.helpers) {
      this.helpers.forEach(ea => ea.remove())
    }
    this.helpers = []
  }

  /*
   * Snap the extent (for resizing) of target to sides of other objects
   */
  snapToExtent(leftRightTopOrBottom, otherLeftRightTopOrBottom, padding) {
    if (padding === undefined) padding = 0;
    var isHorizontal = leftRightTopOrBottom == "top" || leftRightTopOrBottom == "bottom" 
    
    if (!otherLeftRightTopOrBottom) otherLeftRightTopOrBottom = leftRightTopOrBottom
    var target = this.target
    var snap  =_.groupBy(this.all, ea => 
      Math.round(lively.getBounds(ea)[otherLeftRightTopOrBottom]() + padding));
    
    var oldBounds = lively.getBounds(target)
    var old = oldBounds[leftRightTopOrBottom]();
   
    var snapped = _.sortBy(
      Object.keys(snap).filter(ea => Math.abs(ea - old) < this.snapDistance),
      ea => Math.abs(ea - old))[0];
      
    if (snapped !== undefined) {
      // show snapped with a helper
      this.showHelpers(snap, snapped, isHorizontal)
      var delta = snapped - old; 
      var oldExtent = lively.getExtent(this.target); // somehow different from bounds
      if (leftRightTopOrBottom == "bottom") {
        lively.setExtent(this.target, pt(oldExtent.x, oldExtent.y + delta))
      }
      if (leftRightTopOrBottom == "right") {
        lively.setExtent(this.target, pt(oldExtent.x + delta, oldExtent.y))
      }
    }
  }

  /*
   * Snap the position of target to sides of other objects
   */
  snapTo(leftRightTopOrBottom, otherLeftRightTopOrBottom, padding) {
    if (padding === undefined) padding = 0;
    var isHorizontal = leftRightTopOrBottom == "top" || leftRightTopOrBottom == "bottom" 
    
    if (!otherLeftRightTopOrBottom) otherLeftRightTopOrBottom = leftRightTopOrBottom
    var target = this.target
    var snap  =_.groupBy(this.all, ea => 
          Math.round(lively.getBounds(ea)[otherLeftRightTopOrBottom]() + padding));
    var oldBounds = lively.getBounds(target);
    var old = oldBounds[leftRightTopOrBottom]();
    
    var snapped = _.sortBy(
        Object.keys(snap).filter(ea => Math.abs(ea - old) < this.snapDistance),
        ea => Math.abs(ea - old))[0];
      
    if (snapped !== undefined) {
      this.showHelpers(snap, snapped, isHorizontal)
      var pos = lively.getPosition(target)
      if (isHorizontal)
        lively.moveBy(target, pt(0, snapped - old))
      else
        lively.moveBy(target, pt(snapped - old, 0))
    }
  }
}
