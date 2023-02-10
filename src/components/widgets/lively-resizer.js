import Morph from 'src/components/widgets/lively-morph.js';
import {pt}  from 'src/client/graphics.js';
import {Grid} from 'src/client/morphic/snapping.js';

import Preferences from "src/client/preferences.js"

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
    lively.notify('onPointerMoveStart')
    this.count = 0
    var element = this.getElement()
    if (!element) return; // do nothging... should this happen?
    
    this.originalExtent = lively.getExtent(element)
    this.originalPosition = lively.getPosition(element)
      
    this.dragOffset = lively.getPosition(evt);
    evt.stopPropagation();
    this.didDrag = false;
    
    lively.addEventListener('lively-resizer-drag', document.documentElement, 'pointermove',
      evt => this.onPointerMove(evt), true);
    lively.addEventListener('lively-resizer-drag', document.documentElement, 'pointerup',
      evt => this.onPointerMoveEnd(evt));
  
  }
  
  onPointerMove(evt) {
    lively.notify('onPointerMove')
    if (!evt.clientX) return

    var element = this.getElement()
    if (!element) return; // do nothing... should this happen?

    this.count++ 
    if (this.count == 1) return; // ignore the first event because it seems to be off
    
    // 1. calculate values
    var pos = lively.getPosition(evt);
    // lively.showPoint(pos.addPt(lively.getGlobalPosition(document.body)))
    
    var delta = pos.subPt(this.dragOffset)
    if (!this.didDrag && delta.magnitude()) {
      this.didDrag = true;
    }

    // 3. update new values
    
    // #TODO transfer this to all corners!
    function maybeSnapToGrid(point) {
      if (!Preferences.get("SnapWindowsInGrid")) {
        return point
      }
      return Grid.snapPt(point, 100, 10)
    }

    let newPosition, newExtent;
    if (this.classList.contains("top-left")) {
      newPosition = this.originalPosition.addPt(pt(Math.min(delta.x, this.originalExtent.x), 
                                                       Math.min(delta.y, this.originalExtent.y)))    
      newExtent = this.originalExtent.addPt(pt(-delta.x, -delta.y))    
    } else if (this.classList.contains("top-right")) {
      newPosition = this.originalPosition.addPt(pt(0, Math.min(delta.y, this.originalExtent.y)))    
      newExtent = this.originalExtent.addPt(pt(delta.x, -delta.y))    
    } else if (this.classList.contains("bottom-left")) {
      newPosition = this.originalPosition.addPt(pt(Math.min(delta.x, this.originalExtent.x), 0))    
      newExtent = this.originalExtent.addPt(pt(-delta.x, delta.y))    
    } else if (this.classList.contains("bottom-right")) {
      newPosition = this.originalPosition
      newExtent = maybeSnapToGrid(this.originalExtent.addPt(delta))
    } else if (this.classList.contains("left")) {
      newPosition = this.originalPosition.addX(Math.min(delta.x, this.originalExtent.x))    
      newExtent = this.originalExtent.addX(-delta.x)
    } else if (this.classList.contains("top")) {
      newPosition = this.originalPosition.addY(Math.min(delta.y, this.originalExtent.y))    
      newExtent = this.originalExtent.addY(-delta.y)
    } else if (this.classList.contains("bottom")) {
      newPosition = this.originalPosition
      newExtent = maybeSnapToGrid(this.originalExtent.addY(delta.y))
    } else if (this.classList.contains("right")) {
      newPosition = this.originalPosition
      newExtent = maybeSnapToGrid(this.originalExtent.addX(delta.x))
    } else {
      lively.notify('unknown resizer anchor')
      return
    }

    lively.setPosition(element, newPosition)
    lively.setExtent(element, newExtent)

    element.dispatchEvent(new CustomEvent("extent-changed"))
    
    evt.stopPropagation();
    evt.preventDefault();
  }
  
  onPointerMoveEnd(evt) {
    lively.notify('onPointerMoveEnd')
    evt.stopPropagation();
    evt.preventDefault();

    lively.removeEventListener('lively-resizer-drag',  document.documentElement)
    
    if (!this.didDrag) {
      // copy display-property of moveable-element
      let displayCopy = this.style.display;
      
      try {
        // hide moveable-element
        this.style.display = 'none';
        
        // get x- and y-position from current event
        let { x, y } = lively.getPosition(evt);

        // create click event with position
        const types = [
        //   ['pointerdown', {
        //   pointerType: 'mouse',
        //   isPrimary: true
        // }], 'mousedown', 'mouseup', ['pointerdown', {
        //   pointerType: 'mouse',
        //   isPrimary: true
        // }], 
                       'click'];
        const events = types.map(type => {
          const [ name, props ] = Array.isArray(type) ? type : [type, {}];
          return new MouseEvent(name, {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            ...props
          });
        })

        // get underlying-element at mouse-position
        let element = document.elementFromPoint(x, y);
        // dispatch event for the underlying-element
        events.forEach(e => element.dispatchEvent(e))
      } finally {
        // restore display-property of moveable-element
        this.style.display = displayCopy;
      }
    }
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
