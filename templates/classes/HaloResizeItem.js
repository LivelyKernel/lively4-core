
import HaloItem from './HaloItem.js';

export default class HaloResizeItem extends HaloItem {
  initialize() {
    console.log("init resize")
      lively.addEventListener("Morphic", this, 'mousedown',  e => this.onMouseDown(e));
      lively.addEventListener("Morphic", this, 'mouseup',  e => this.onMouseUp(e));
  }

  onMouseDown(evt) {
    console.log("...")
    this.start(evt);

    // attach mousemove handler to body only after mousedown occured
    $(document).off("mousemove.resize").on("mousemove.resize", (evt) => {
      this.move(evt);
      // update position of halos on mousemove
      HaloService.showHalos(window.that);
    });
  }

  onMouseUp(evt) {
    if (this.resizing) {
      this.stop(evt);
      // detach mousemove handler from body
      $(document).off("mousemove.resize");
    }
  }

  start(e) {
    e.preventDefault();
  
    let $el = $(window.that)
    let offsetWindow = $el.offset();
  
    this.removeRestrictions($el)
  
    this.resizing = {
      left: offsetWindow.left,
      top: offsetWindow.top,
      offsetX: offsetWindow.left + $el.width() - e.pageX,
      offsetY: offsetWindow.top + $el.height() - e.pageY
    };
  }

  stop(e) {
    e.preventDefault();
    this.resizing = false;
  }

  move(e) {
    e.preventDefault();
  
    if (this.resizing) {
      $(window.that).css({
        width: e.pageX - this.resizing.left + this.resizing.offsetX,
        height: e.pageY - this.resizing.top + this.resizing.offsetY
      });
    }
  }

  removeRestrictions($el) {
    $el.css({
      "min-width": "none",
      "min-height": "none",
      "max-width": "none",
      "max-height": "none"
    })
  }
    
    
}