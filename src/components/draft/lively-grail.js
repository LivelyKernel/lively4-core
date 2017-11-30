import LivelyPaper from './lively-paper.js';

import Grail from 'src/external/grail.js'

export default class LivelyGrail extends LivelyPaper {
  
  
  
  
  initialize() {
    super.initialize();
    this.grail = new Grail();

    this.grail.SetThinningThreshold(0.15);
    this.grail.SetCharacterCallback((character, justifications) => {
    	  this.get("#result").innerHTML = "recognized " + character;
    });
    
    
    throw new Error("grr")
  }

  mousePos(evt) {
    return {x: (evt.x  - this.offset.left), 
      y: this.canvas.getAttribute("height") - (evt.y - this.offset.top)};
  }

  screenPos(pos) {
    // #TODO figure out how to transform the coordinates
    return {x: this.canvas.getAttribute("width") - pos.x, 
      y: pos.y};
  }


  onPointerDown(evt) {
    Object.values(this.lastPath).forEach(ea => {
      ea.remove()
    })
    
    super.onPointerDown(evt)

    this.grail.Init();
    this.get("#result").innerHTML = ""
    lively.notify("Data " + this.grail.ThinnedData())
    var pos = this.mousePos(evt)
    this.grail.OnPenDown(pos)
  }
  
  
  onPointerMove(evt) {
    this.grail.OnPenMove(this.mousePos(evt))
    return super.onPointerMove(evt)
  }
  
  onPointerUp(evt) {
    // this.update()
    this.grail.OnPenUp(this.mousePos(evt))
    super.onPointerUp(evt)
    this.strokes.undo()

  }
  
  update() {

    var r = this.grail.ContainingRect();
    lively.notify("r " + r.x0)
    
    if (this.containingRect) {
      this.containingRect.remove()
    }
    this.containingRect = new this.paper.Path()
    this.containingRect.strokeColor = "green"
    this.containingRect.add(this.screenPos({x: r.x0,  y: r.y0}))
    this.containingRect.add(this.screenPos({x: r.x1,  y: r.y0}))
    this.containingRect.add(this.screenPos({x: r.x1,  y: r.y1}))
    this.containingRect.add(this.screenPos({x: r.x0,  y: r.y0}))
    
    // if (this.thinnedCurvature) {
    //   this.thinnedCurvature.remove()
    // }
    // this.thinnedCurvature = new this.paper.Path()
    // this.thinnedCurvature.strokeColor = "red"
    // // lively.openInspector(
    // //   this.grail.ThinnedCurvature())
    // this.grail.ThinnedCurvature().forEach(ea => {
    //   this.thinnedCurvature.add(ea.point)
    // })
  // grail.ThinnedData()

  // grail.CornerData();
  }
}
     
      