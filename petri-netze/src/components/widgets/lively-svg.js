import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import DragBehavior from "src/client/morphic/dragbehavior.js"

export default class LivelySVG extends Morph {
  
      
  initialize() {

  }
  
 
  livelyExample() {
    this.innerHTML = `<svg>
      <path id="path" stroke='gray' stroke-width="2" d="M 0 0 L 100 100"
         stroke-linejoin="round"</path>
	</svg>`
  }
  
}
      

     
      