"disable deepeval"

import Morph from 'src/components/widgets/lively-morph.js';
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import selecting from 'src/client/morphic/selecting.js';
import {pt, rect, Rectangle} from 'src/client/graphics.js';
import preferences from 'src/client/preferences.js';
import {Grid} from 'src/client/morphic/snapping.js';
import DragBehavior from 'src/client/morphic/dragbehavior.js'
import svg from 'src/client/svg.js'

/* globals that */

let svgStrategy = {
  match(target) {
    return target instanceof SVGSVGElement || target instanceof SVGElement;
  },
  
  configureHalo(halo) {
    halo.setHandleVisibility(true);

    this.querySelectorAll(':not(marker)>path').forEach(ea => {
      svg.getPathVertices(ea).forEach((p, index) => {
        halo.ensureControlPoint(ea, index);
        if (p.c == 'Q') {
          halo.ensureControlPoint(ea, index, false, 2);
        }
      });
    });
  },
  
  dragBehaviorStart(halo, evt, pos) {
    evt.preventDefault();
    evt.stopPropagation();
  },
  dragBehaviorMove(halo, evt, pos) {}
}

let defaultStrategy = {
  match(target) {
    return true;
  },
  
  configureHalo(halo) {},
  
  dragBehaviorStart(halo, evt, pos) {
    halo.dragOffset = lively.getPosition(this).subPt(pos);
    halo.alignHaloToBounds(this);
  },
  dragBehaviorMove(halo, evt, pos) {
    lively.setPosition(this, pos.addPt(halo.dragOffset));
    halo.alignHaloToBounds(this);
  }
}

let fallbackStrategies = [svgStrategy, defaultStrategy];

/*
 * Halo, the container for HaloItems
 */
export default class Halo extends Morph {
  
  get isMetaNode() { return true; }
  get haloItems() { return this.shadowRoot.querySelectorAll('.halo'); }
  
  initialize() {
    this.shadowRoot.querySelectorAll('*').forEach(ea => {
      if (ea.isMetaNode === undefined) ea.isMetaNode = true;
    })
    // #TODO Refeactor away jQuery in Halo
    Halo.instance = this;
    this.hidden = true
    // window.HaloService = Halo; // #Deprecated
    Object.defineProperty(window, 'HaloService', {
      get() {
        try {
          throw new Error("Using global HaloService property is deprecated")
        } catch(e) {
          lively.showError(e)
        }
        return Halo;
      },
       configurable: true
    });

    
    var targetContext = document.body.parentElement;
    
    lively.removeEventListener('Halo', document.body);
    lively.addEventListener('Halo', document.body, 'pointerdown', 
      evt => this.onBodyMouseDown(evt, targetContext));

    this.haloItems.forEach(ea => ea.halo = this);
    DragBehavior.on(this);
  }
  
  onBodyMouseDown(evt, targetContext) {
    this.targetContext = targetContext;
    evt.stopPropagation();
    var whitelistNodes = lively.html.findAllNodes() // #TODO only find nodes of subelement
        .filter (ea => ea.tagName == 'INPUT' || 
          ea.tagName == 'LI' || ea.tagName == 'TD' ||
          ea.tagName == 'P' ||  ea.tagName == 'PRE')
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
  
  setHandleVisibility(shouldHide) {
    let visibility = shouldHide ? 'hidden' : null;
    this.shadowRoot.querySelectorAll('lively-halo-handle-item').forEach(ea => {
      ea.style.visibility = visibility;
    });
  }

  resetHaloControlPointItem() {
    this.shadowRoot.querySelectorAll('lively-halo-control-point-item')
      .forEach(ea => ea.remove());
  }
  
  resetHaloConfig() {
    this.resetHaloControlPointItem();
    
    this.get('#default-items').style.display = null;
    this.get('#vivide-items').style.display = null;

    this.setHandleVisibility(false);
    
    this.get('#vivide-outport-connection-items').innerHTML = '';
    this.get('#vivide-inport-connection-items').innerHTML = '';
  }

  ensureControlPoint(path, index, isConnector, curveIndex) {
    var id = 'controlPoint' + index+ (curveIndex ? '-' + curveIndex : '');
    var controlPoint = this.shadowRoot.querySelector('#' + id);
    if (!controlPoint) {
      controlPoint = document.createElement('lively-halo-control-point-item');
      controlPoint.id = id;
      this.shadowRoot.appendChild(controlPoint);
    }
    controlPoint.isConnector = isConnector;
    controlPoint.curveIndex = curveIndex;
    controlPoint.setup(this, path, index);
    controlPoint.style.visibility= '';
    return controlPoint;
  }
  
  showHalo(target, path) {
    document.body.appendChild(this);
    lively.html.registerKeys(document.body, 'HaloKeys', this);
    this.hidden = false
    this.style.display = ""
    
    if (!target || !target.getBoundingClientRect) { return; }
    lively.globalFocus();
  
    this.alignHaloToBounds(target);
    
    this.resetHaloConfig();
    this.dispatch(target, 'configureHalo');
    this.haloItems.forEach(ea => {
      if (ea.updateTarget) {
        ea.updateTarget(target);
      }
    });
  }
  
  dispatch(target, methodName, ...args) {
    if (!target) { return; }

    // instance-specific handling
    if(target && target.livelyHalo) {
      let haloStrategy = target.livelyHalo();
      if(haloStrategy[methodName]) {
        haloStrategy[methodName].call(target, this, ...args);
        return;
      }
    }
    
    // fallback to generic handlers
    let fallbackStrategy = fallbackStrategies
      .find(strategy => strategy[methodName] && strategy.match(target));
    if(fallbackStrategy) {
      fallbackStrategy[methodName].call(target, this, ...args);
    } else {
      lively.warn('no halo handler found for ' + methodName);
    }
  }
  
  alignHaloToBounds(target) {
    const margin = 30;
    var bounds = lively.getGlobalBounds(target);
    
    var offset = {
      top: bounds.top() +  window.scrollY,  
      left: bounds.left() +  window.scrollX
    };
  
    // viewport coordinates
    var scrollTop = Math.abs(window.scrollY);
    var scrollLeft = Math.abs(window.scrollX);
    

    // make sure halo respects left and top viewport boundary
    var offsetTop = Math.max(offset.top - margin, scrollTop);
    var offsetLeft = Math.max(offset.left - margin, scrollLeft);
    var offsetTopDiff = offsetTop - offset.top;
    var offsetLeftDiff = offsetLeft - offset.left;
    offset.top = offsetTop;
    offset.left = offsetLeft;

    // make sure halo respects right and bottom viewport boundary
    var width = bounds.width - offsetLeftDiff + margin;
    var height = bounds.height - offsetTopDiff + margin;
    var offsetBottom = Math.min(offset.top + height, scrollTop + window.innerHeight);
    var offsetRight = Math.min(offset.left + width, scrollLeft + window.innerWidth);
    width = offsetRight - offsetLeft;
    height = offsetBottom - offsetTop;

    lively.setGlobalPosition(this, pt(offset.left - scrollLeft, offset.top - scrollTop))
    lively.setExtent(this, pt(width, height))
    
    var boundsRect = lively.getGlobalBounds(that);
    ['topLeft', 'bottomLeft', 'bottomRight', 'topRight'].forEach(ea => {
      lively.setGlobalPosition(this.get('#' + ea), boundsRect[ea]());
    });
  }
  
  static showHalos(target, path) {
    this.target = target;
    this.instance.showHalo(target, path);
  }
  
  static hideHalos() {
    if(this.instance.info) {
      this.instance.info.stop()
    }
    lively.removeEventListener('HaloKeys', document.body)
    if (Halo.lastIndicator)
      Halo.lastIndicator.remove()
    if (this.areHalosActive())
      this.halosHidden = Date.now();
    lively.setPosition(this.instance, pt(0, 0))
    this.instance.hidden = true
  }
  
  static hideHaloItems() {
    this.instance.haloItems.forEach(ea => ea.style.visibility = 'hidden');
  }

  static showHaloItems() {
    this.instance.haloItems.forEach(ea => ea.style.visibility = null);
    
    // #TODO: this usually called updateHandles
    //this.instance.showHalo(window.that);
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
   var gridSize = lively.preferences.get('GridSize') * 0.25;
    if (evt.altKey) {
      delta = delta.scaleBy(gridSize);
    }
    
    if (evt.shiftKey) {
      var newExtent =lively.getExtent(that).addPt(delta);
      lively.setExtent(that, newExtent);

      if (evt.altKey) {
        lively.setExtent(that, Grid.snapPt(lively.getExtent(that), gridSize, gridSize / 2));
      }
    } else {
      lively.moveBy(that, delta);
      if (evt.altKey) {
        lively.setPosition(that, Grid.snapPt(lively.getPosition(that), gridSize, gridSize * 0.5));
      }
    }
    evt.preventDefault();
    evt.stopPropagation();
    this.alignHaloToBounds(that);
    
    if(this.info) {
      this.info.stop();
    }
    this.info = lively.showInfoBox(that);

    if(that) {
      this.info.innerHTML = `x=${lively.getPosition(that).x} y=${lively.getPosition(that).y} w=${lively.getExtent(that).x} h=${lively.getExtent(that).y}`;
    }
  }
  
  onLeftDown(evt) {
    this.moveTargetOnEventWithKey(evt, pt(-1,0));
  }

  onRightDown(evt) {
    this.moveTargetOnEventWithKey(evt, pt(1,0));
  }

  onUpDown(evt) {
    this.moveTargetOnEventWithKey(evt, pt(0,-1));
  }
  
  onDownDown(evt) {
    this.moveTargetOnEventWithKey(evt, pt(0,1));
  }

  // onKeyUp(evt) {
  //   if(this.info) this.info.stop()
  // }
  
  // Override defdault DragBehavior
  dragBehaviorStart(evt, pos) {
    this.dispatch(that, 'dragBehaviorStart', evt, pos);
  }
  
  dragBehaviorMove(evt, pos) {
    this.dispatch(that, 'dragBehaviorMove', evt, pos);
  }

  static areHalosActive() {
    
    return Halo.instance && (!Halo.instance.hidden && Halo.instance.style.display !== "none");
  }
  
  static migrate() {
    var old = document.querySelector('lively-halo');
    if (old) {
      old.remove();
      lively.haloService === Halo
      lively.initializeHalos();
    }
  }
}

Halo.migrate();
