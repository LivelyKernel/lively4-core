
import {pt} from "src/client/graphics.js"

export default class Snapping {

  static snapTo(target) {
    var snapping = new Snapping(target)
    snapping.snap()
  }
  
  constructor(target) {
    this.target = target
    this.helpers = []
    this.snapDistance = 20
  }

  snap() {
    this.clearHelpers()
    this.snapBorder("left")
    this.snapBorder("top")
    this.snapBorder("right")
    this.snapBorder("bottom")

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

  snapBorder(leftRightTopOrBottom) {
    var isHorizontal = leftRightTopOrBottom == "top" || leftRightTopOrBottom == "bottom" 
    var target = this.target
    var snap  =_.groupBy(this.all, ea => Math.round(lively.getGlobalBounds(ea)[leftRightTopOrBottom]()));
    
    var old = lively.getGlobalBounds(target)[leftRightTopOrBottom]();
    
    var snapped = _.sortBy(
      Object.keys(snap).filter(ea => Math.abs(ea - old) < 20),
      ea => Math.abs(ea - old))[0];
      
    if (snapped !== undefined) {
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
                [pt(ea, 0), pt(ea,window.innerHeight)] 
              
              return lively.showPath(line, "rgba(100,255,100,0.5)", false)
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



  
  
  