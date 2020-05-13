import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js';



export default class LivelyPetrinetNode extends Morph {

  initialize() {
    this.windowTitle = "LivelyPetrinetNode";
    this.registerButtons();
    //this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
  }
  
  attachedCallback() {
  }
  
  detachedCallback() {
  }
  
  
  onAddButton() {
    this.addBall()
  }
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();

        var menu = new ContextMenu(this, [
              ["add shape", () => this.addShape()],
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  
  async addShape() {
      var shape = (<div>Hello</div>);
      this.appendChild(shape);
  }
  
  

}