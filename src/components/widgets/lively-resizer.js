import Morph from 'src/components/widgets/lively-morph.js';
import {pt}  from 'src/client/graphics.js';
import {Grid} from 'src/client/morphic/snapping.js';


export default class Resizer extends Morph {
  initialize() {    
    this.addEventListener('pointerdown', (evt) => { this.onPointerMoveStart(evt) });
  }

  getElement() {
    if (this.target) {
      return this.target
    } else if (this.parentElement) {
      return this.parentElement 
    } else if (this.parentNode && this.parentNode.host) {
      return this.parentNode.host
    }
    return null
  }
  
  onPointerMoveStart(evt) {
    this.count = 0
    var element = this.getElement()
    if (!element) return; // do nothging... should this happen?
    
    this.originalExtent = lively.getExtent(element)
    this.originalPosition = lively.getPosition(element)
      
    this.dragOffset = lively.getPosition(evt);
    evt.stopPropagation();
    
    lively.addEventListener('lively-resizer-drag', document.documentElement, 'pointermove',
      evt => this.onPointerMove(evt), true);
    lively.addEventListener('lively-resizer-drag', document.documentElement, 'pointerup',
      evt => this.onPointerMoveEnd(evt));
  
  }
  
  onPointerMove(evt) {
    if (!evt.clientX) return

    var element = this.getElement()
    if (!element) return; // do nothging... should this happen?

    this.count++ 
    if (this.count == 1) return; // ignore the first event because it seems to be off
    
    // 1. calculate values
    var pos = lively.getPosition(evt);
    // lively.showPoint(pos.addPt(lively.getGlobalPosition(document.body)))
    
    var delta = pos.subPt(this.dragOffset)

    // 3. update new values

    if (this.classList.contains("top-left")) {
      var newPosition = this.originalPosition.addPt(pt(Math.min(delta.x, this.originalExtent.x), 
                                                       Math.min(delta.y, this.originalExtent.y)))    
      var newExtent = this.originalExtent.addPt(pt(-delta.x, -delta.y))    
            
      lively.setPosition(element,  newPosition)  
      lively.setExtent(element, newExtent)   

    } else  if (this.classList.contains("top-right")) {
      var newPosition = this.originalPosition.addPt(pt(0, Math.min(delta.y, this.originalExtent.y)))    
      var newExtent = this.originalExtent.addPt(pt(delta.x, -delta.y))    
      
      lively.setPosition(element,  newPosition)  
      lively.setExtent(element, newExtent)   

    } else if (this.classList.contains("bottom-left")) {
      var newPosition = this.originalPosition.addPt(pt(Math.min(delta.x, this.originalExtent.x), 0))    
      var newExtent = this.originalExtent.addPt(pt(-delta.x, delta.y))    
      
      lively.setPosition(element,  newPosition)  
      lively.setExtent(element, newExtent)   

    } else {
      
      var newExtent = this.originalExtent.addPt(delta)    
      
      newExtent = Grid.snapPt(newExtent,100,10)  // #TODO transfere this to the other corners!

      lively.setExtent(element, newExtent)   
    }

    element.dispatchEvent(new CustomEvent("extent-changed"))
    
    evt.stopPropagation();
    evt.preventDefault();
  }
  
  onPointerMoveEnd(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    
    lively.removeEventListener('lively-resizer-drag',  document.documentElement)
  }
  
  async livelyExample() {
    
    var div2 = <div style="background-color: gray; top:100px; position: absolute; left:100px;width:100px; height:100px"></div>
    var div = <div style="background-color: lightgray">{div2}</div>

    var topRight = await (<lively-resizer class="top-right"></lively-resizer>)        
    topRight.target = div2    
    topRight.style.color = "green"
    div2.appendChild(topRight)

    var topLeft = await (<lively-resizer class="top-left"></lively-resizer>)        
    topLeft.target = div2    
    topLeft.style.color = "yellow"
    div2.appendChild(topLeft)

    
    var bottomLeft = await (<lively-resizer class="bottom-left"></lively-resizer>)        
    bottomLeft.target = div2    
    bottomLeft.style.color = "blue"
    div2.appendChild(bottomLeft)

    //default    
    var bottomRight = await (<lively-resizer class="bottom-right"></lively-resizer>)        
    bottomRight.target = div2    
    bottomRight.style.color = "red"
    div2.appendChild(bottomRight)
    
    this.parentElement.appendChild(div)
    this.remove()
  }
  

}
