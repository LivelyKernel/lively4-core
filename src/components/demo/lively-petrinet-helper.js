export class Helper {
  
  
  static startDragAndDrop(mouseEvent, objectToDrag) {
    const offset = lively.getPosition(mouseEvent);
    const originalPosition = lively.getPosition(objectToDrag);
    lively.addEventListener("dragObject", document.body.parentElement, "pointermove", evt => {
      lively.setPosition(objectToDrag, originalPosition.addPt(lively.getPosition(evt).subPt(offset)))
    });
    lively.addEventListener("dragObject", document.body.parentElement, "pointerup", evt => {
      lively.removeEventListener("dragObject", document.body.parentElement)
    });
  }
  
  
  static getRandomId() {
     return Math.random().toString(36).substring(7);
  }
                            
                            
}