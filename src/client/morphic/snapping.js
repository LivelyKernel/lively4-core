
import {pt} from "src/client/graphics.js"

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
    this.clearHelpers()
    this.snapTo("left", "left")
    this.snapTo("left", "right")
    this.snapTo("top", "top")
    this.snapTo("top", "bottom")

    this.snapTo("right", "right")
    this.snapTo("right", "left")

    this.snapTo("bottom", "bottom")
    this.snapTo("bottom", "top")

  }

    
  clearHelpers() {
    if (this.helpers) {
      this.helpers.forEach(ea => ea.remove())
    }
    this.helpers = []
  }

  get all() {
    if (!this._all) {
      this._all = lively.array(this.target.parentElement.querySelectorAll(":scope > *"))
        .filter(ea => (ea !== this.target) && ea.classList.contains("lively-content"));
    }
    return this._all
  }

  

  snapTo(leftRightTopOrBottom, otherLeftRightTopOrBottom) {
    var isHorizontal = leftRightTopOrBottom == "top" || leftRightTopOrBottom == "bottom" 
    
    if (!otherLeftRightTopOrBottom) otherLeftRightTopOrBottom = leftRightTopOrBottom
    var target = this.target
    var snap  =_.groupBy(this.all, ea => Math.round(lively.getGlobalBounds(ea)[otherLeftRightTopOrBottom]()));
    
    var old = lively.getGlobalBounds(target)[leftRightTopOrBottom]();
    
    var snapped = _.sortBy(
      Object.keys(snap).filter(ea => Math.abs(ea - old) < this.snapDistance),
      ea => Math.abs(ea - old))[0];
      
    if (snapped !== undefined) {
      // show snapped with a helper
      Object.keys(snap)
        .filter(ea => ea  == snapped)
        .forEach( ea => {
          this.helpers = this.helpers.concat(
            snap[ea].map(eaElement => {
              var line = isHorizontal ? 
                [pt(Math.min(
                  lively.getGlobalBounds(eaElement).left(),
                  lively.getGlobalBounds(this.target).left()), ea), 
                 pt(Math.max(
                  lively.getGlobalBounds(eaElement).right(),
                  lively.getGlobalBounds(this.target).right()), ea)]:
                [pt(ea, Math.min(
                  lively.getGlobalBounds(eaElement).top(),
                  lively.getGlobalBounds(this.target).top())), 
                 pt(ea, Math.max(
                  lively.getGlobalBounds(eaElement).bottom(),
                  lively.getGlobalBounds(this.target).bottom()))]

              return lively.showPath(line, "rgba(80,80,80,0.8)", false)
            }));
        })
      var pos = lively.getGlobalPosition(target)
      if (isHorizontal)
        lively.moveBy(target, pt(0, snapped - old))
      else
        lively.moveBy(target, pt(snapped - old, 0))
    }
  }
  

  
  
}



  
  
  