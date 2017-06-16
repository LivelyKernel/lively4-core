import Morph from './Morph.js';
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import selecting from 'src/client/morphic/selecting.js';
import {pt, rect, Rectangle} from 'src/client/graphics.js';
import preferences from 'src/client/preferences.js';
import {Grid} from 'src/client/morphic/snapping.js';
import DragBehavior from "src/client/morphic/dragbehavior.js"

/*
 * Halo, the container for HaloItems
 */
export default class Halo extends Morph {
  
  get isMetaNode() { return true}

  initialize() {
    this.shadowRoot.querySelectorAll("*").forEach(ea => {
      if (ea.isMetaNode === undefined) ea.isMetaNode = true
    })
    Halo.halo = $(this); // #TODO Refeactor away jQuery in Halo
    Halo.halo.hide();
    window.HaloService = Halo;
    var targetContext = document.body.parentElement
    
    lively.removeEventListener("Halo", targetContext);
    lively.addEventListener("Halo", document.body, "mousedown", 
      evt => this.onBodyMouseDown(evt, targetContext));

    this.shadowRoot.querySelectorAll(".halo").forEach(ea => ea.halo = this)
    
   
    
    DragBehavior.on(this)
  }
  
  
  onBodyMouseDown(evt, targetContext) {
    // lively.notify("down " + targetContext);
    this.targetContext = targetContext;
    evt.stopPropagation();
    // lively.notify("mouse down " + targetContext)
    var whitelistNodes = lively.html.findAllNodes() // #TODO only find nodes of subelement
        .filter (ea => ea.tagName == 'INPUT' || 
          ea.tagName == "LI" || ea.tagName == "TD" ||
          ea.tagName == "P" ||  ea.tagName == "PRE")
        .filter (ea => {
          var b = ea.getBoundingClientRect();
          var bounds = new Rectangle(b.left, b.top, b.width, b.height) ;
          var pos = events.globalPosition(evt);
          // lively.showPoint(bounds.topLeft())
          // lively.showPoint(pos)
          return bounds.containsPoint(pos);
      });
    // inputFields.forEach( ea => lively.showElement(ea))
    if (whitelistNodes.length > 0) {
      // evt.preventDefault();
      // evt.stopPropagation();
      document.body.draggable=false; 
      return false;
    }
    document.body.draggable=true; 
  }

  showHalo(target, path) {
    document.body.appendChild(this);
    lively.html.registerKeys(document.body, "HaloKeys", this)
    if (!target || !target.getBoundingClientRect) {
      $(this).show();
      return;
    }
    $(this).show();
    document.body.setAttribute("tabindex", 0)
    document.body.focus()
  
    this.alignHaloToBounds(target)
  }
  
  alignHaloToBounds(target) {
    var bounds = target.getBoundingClientRect();
    var offset = {
      top: bounds.top +  $(document).scrollTop(), 
      left: bounds.left +  $(document).scrollLeft()};
  
    // viewport coordinates
    var scrollTop = Math.abs($(document).scrollTop());
    var scrollLeft = Math.abs($(document).scrollLeft());

    // make sure halo respects left and top viewport boundary
    var offsetTop = Math.max(offset.top - 30, scrollTop);
    var offsetLeft = Math.max(offset.left - 30, scrollLeft);
    var offsetTopDiff = offsetTop - offset.top;
    var offsetLeftDiff = offsetLeft - offset.left;
    offset.top = offsetTop;
    offset.left = offsetLeft;

    // make sure halo respects right and bottom viewport boundary
    var width = $(target).outerWidth() - offsetLeftDiff + 30;
    var height = $(target).outerHeight() - offsetTopDiff + 30;
    var offsetBottom = Math.min(offset.top + height, scrollTop + $(window).height());
    var offsetRight = Math.min(offset.left + width, scrollLeft + $(window).width());
    width = offsetRight - offsetLeft;
    height = offsetBottom - offsetTop;

    // set position and dimensions of halo
    $(this).offset(offset);

    $(this).outerWidth(width);
    $(this).outerHeight(height);
    
    var boundsRect = lively.getGlobalBounds(that);
    ["topLeft", "bottomLeft", "bottomRight", "topRight"].forEach(ea => {
      lively.setGlobalPosition(this.get("#" + ea), boundsRect[ea]())  
    })
    
  }
  
  static showHalos(target, path) {
    this.target = $(target);
    this.halo[0].showHalo(target, path);
  }
  
  static hideHalos() {
    if(this.halo[0].info) {
      this.halo[0].info.stop()
    }
    lively.removeEventListener("HaloKeys", document.body)
    if (HaloService.lastIndicator)
      HaloService.lastIndicator.remove()
    if (this.areHalosActive())
      this.halosHidden = Date.now();
    this.halo.offset({left:0, top: 0});
    this.halo.hide();
  }
  
  // 
  // Positioning of Elments with arrow keys
  //
  
  /*
   * Arrow Keys     .... move halo target
   * holding SHIFT  .... resize halo target
   * holding ALT    .... align to in bigger steps to grid (resize and move)
   */
  moveTargetOnEventWithKey(evt, delta) {
   var gridSize = lively.preferences.get("gridSize") * 0.25;
    if (evt.altKey) {
      delta = delta.scaleBy(gridSize)
    }
    
    if (evt.shiftKey) {
      var newExtent =lively.getExtent(that).addPt(delta)
      lively.setExtent(that, newExtent)

      if (evt.altKey) {
        lively.setExtent(that, Grid.snapPt(lively.getExtent(that), gridSize, gridSize / 2))
      }
    } else {
      lively.moveBy(that, delta)
      if (evt.altKey) {
        lively.setPosition(that, Grid.snapPt(lively.getPosition(that), gridSize, gridSize * 0.5))
      }
      
    }
    evt.preventDefault()
    evt.stopPropagation()
    this.alignHaloToBounds(that)
    
    if(this.info) this.info.stop()
    this.info = lively.showInfoBox(that)

    if (that)
      this.info.innerHTML=`x=${lively.getPosition(that).x} y=${lively.getPosition(that).y} w=${lively.getExtent(that).x} h=${lively.getExtent(that).y}`
  }
  
  onLeftDown(evt) {
    this.moveTargetOnEventWithKey(evt, pt(-1,0))
  }

  onRightDown(evt) {
    this.moveTargetOnEventWithKey(evt, pt(1,0))
  }

  onUpDown(evt) {
    this.moveTargetOnEventWithKey(evt, pt(0,-1))
  }
  
  onDownDown(evt) {
    this.moveTargetOnEventWithKey(evt, pt(0,1))
  }

  // onKeyUp(evt) {
  //   if(this.info) this.info.stop()
  // }
  
  // Override defdault DragBehavior
  dragBehaviorStart(evt, pos) {
    this.dragOffset = lively.getPosition(that).subPt(pos)
    this.alignHaloToBounds(that)
  }
  
  dragBehaviorMove(evt, pos) {
    lively.setPosition(that, pos.addPt(this.dragOffset));
    this.alignHaloToBounds(that)
  }

  static areHalosActive() {
    return Halo.halo && this.halo.is(":visible");
  }
  

  
  static migrate() {
    var old = document.querySelector("lively-halo")
    if (old) {
      old.remove()
      lively.initializeHalos()
    }
  }
  
}


Halo.migrate()


