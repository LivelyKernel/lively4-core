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
  
  static getSelectedBorder() {
    return "3px solid #FF6E40"
  }
  
  static getDisselectedBorder() {
    return "1px solid #333333";
  }
  
  static getPetrinetOf(component){
    const petrinet = lively.query(component, "lively-petrinet-editor");
    if (petrinet === undefined) {
      lively.error("Error: No Petrinet")
    }
    return petrinet;
  }
  
  static shuffled(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  
  /* The function works, but I got horrible errors when trying to change the innerHTML before saving, so we wont use prettyPrint.
  static prettyPrinted(html) {
    const tags = html.split("<").slice(1);
    const componentNames = tags.map(tag => tag.split(" ")[0]).map(name => name.replace(">", "")).map(name => name.replace("/", ""));
    const withBeginningSymbol = tags.map(tag => "<" + tag);
    const componentStack = [];
    let prettyHtml = ""
    for (let i = 0; i < tags.length; i++) {
      const lastComponent = componentStack[componentStack.length-1];
      const currentComponent = componentNames[i];
      if (lastComponent === currentComponent) {
        componentStack.pop();
      } else {
        componentStack.push(currentComponent);
      }
      prettyHtml += "\t".repeat(componentStack.length) + withBeginningSymbol[i] + "\n";
    }
    return prettyHtml;
  }
  */
                            
                            
}