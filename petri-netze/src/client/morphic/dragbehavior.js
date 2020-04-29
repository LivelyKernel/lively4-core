import {pt} from "src/client/graphics.js" 

export default class DragBehavior {
  static on(target) {
    return new DragBehavior(target)  
  }
  
  constructor(target) {
    this.target = target
    this.target.draggable = true
    lively.addEventListener("DragBehavior", this.target, "dragstart", 
      (evt) => this.onDragStart(evt))

  }
  
  onDragStart(evt) {
    this.originalPosition = lively.getPosition(this.target)
    this.offset = this.originalPosition.subPt(pt(evt.clientX, evt.clientY))
    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 

    lively.addEventListener("DragBehavior", this.target, "drag", 
      (evt) => this.onDrag(evt))
    lively.addEventListener("DragBehavior", this.target, "dragend", 
      (evt) => this.onDragEnd(evt))
      
    if (this.target.dragBehaviorStart) {
      this.target.dragBehaviorStart(evt, this.originalPosition)
    }
  }
  
  onDrag(evt) {
    // console.log("pos " + evt.clientX, evt.offsetX, evt.clientX - evt.offsetX, evt )
    if (evt.clientX == 0 && evt.clientY == 0) return; // #Garbage event
    if (evt.offsetX < 0) return; // another #Garbage event

    var pos = pt(evt.clientX, evt.clientY).addPt(this.offset)
    if (this.target.dragBehaviorMove) {
      this.target.dragBehaviorMove(evt, pos, this.originalPosition)
    } else {
      lively.setPosition(this.target, pos)
    }
  }

  onDragEnd(evt) {
    lively.removeEventListener("DragBehavior", this.target, "drag")
    lively.removeEventListener("DragBehavior", this.target, "dragend")

    if (this.target.dragBehaviorEnd) {
      this.target.dragBehaviorEnd(evt, this.originalPosition)
    }
  }
}
