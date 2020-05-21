import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';



export default class LivelyPetrinetNode extends Morph {

  initialize() {
    this.windowTitle = "LivelyPetrinetNode";
    this.registerButtons();
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
    //this.addEventListener("add dot", this, "click", () => this.onClick());
    //this.removeEventListener("add dot", this, "click");
    
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
          ["add dot", () => this.addDot()],
          ["delete dot", () => this.deleteDot()],
            ]);
       menu.openIn(document.body, evt, this);
        return true;
      }
  }

      async addDot() {
      
      //for(var i=0; i<1;i++){
      var dot = await (<lively-petrinet-dot></lively-petrinet-dot>);
      //lively.setExtent(dot, pt(50, 50));
      var x = Math.random() * 50 + 25;
      var y = Math.random() * 50 + 25;
      lively.setPosition(dot, pt(x,y));
        
      //lively.setPosition(dot, pt(10, 10));
      this.appendChild(dot); 
  }
  
  
  async deleteDot(){
      this.dots[0].remove()
  }
   
  get dots() {
    return Array.from(this.querySelectorAll("lively-petrinet-dot"));
  }
  
  
}