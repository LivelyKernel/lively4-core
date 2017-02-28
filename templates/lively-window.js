'use strict';

import Morph from './Morph.js';
// import { AExpr } from 'src/external/active-expressions/src/active-expressions.js';

// import { AExpr } from 'src/external/active-expressions/src/active-view.js';


import {pt} from 'src/client/graphics.js'


function getScroll() {
  return {
    x: document.scrollingElement.scrollLeft || 0,
    y: document.scrollingElement.scrollTop || 0
  };
}

export default class Window extends Morph {
  
  
  
  get isWindow() {
    return true
  }

  // how to move this into the template CSS? #Jens
  get minimizedWindowWidth() { return 300 }
  get minimizedWindowPadding() { return 10 }

  /*
   * Getters/Setters
   */
  get title() {
    return this._title
  }
  set title(val) {
    this._title = val
    this.render();
  }
  
  get active() {
    return this.hasAttribute('active');
  }

  get isFixed() {
    return this.hasAttribute('fixed');
  }

  get titleSpan() {
    return this.shadowRoot.querySelector('.window-title span');
  }

  setPosition(left, top) { // x, y
    this.style.top = top + 'px';
    this.style.left = left + 'px';
    this.style.right = "";
    this.style.bottom = "";
  }

  setSize(width, height) {
    this.style.width = width + 'px';
    this.style.height = height + 'px';
  }

  /*
   * HTMLElement callbacks
   */
  initialize() {
    this.setup();

    this.created = true;
    this.render();

    if (this.isMinimized() || this.isMaximized())
      this.displayResizeHandle(false);

    // Capture in window
    // this._capture_expr = new AExpr(win =>
    //   parseInt(win.style.top) < 0 || parseInt(win.style.left) < 0
    // );
    // this._capture_expr
    // .applyOn(this)
    // .onChange(win => {
    //   if (parseInt(win.style.top) < 0) {
    //     win.style.top = 0;
    //   }
    //   if (parseInt(win.style.left) < 0) {
    //     win.style.left = 0;
    //   }
    // });
    
    
    this.setAttribute("tabindex", 0)
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    switch (attrName) {
      case 'title':
        this.render();
        break;
      case 'fixed':
        this.reposition();
        break;
      default:
        //
    }
  }

  /*
   * Initialization
   */

  defineShortcuts() {
    this.window = this.shadowRoot.querySelector('.window');

    this.menuButton = this.shadowRoot.querySelector('.window-menu');
    this.minButton = this.shadowRoot.querySelector('.window-min');
    this.maxButton = this.shadowRoot.querySelector('.window-max');
    this.pinButton = this.shadowRoot.querySelector('.window-pin');
    this.resizeButton = this.shadowRoot.querySelector('.window-resize');
    this.closeButton = this.shadowRoot.querySelector('.window-close');

    this.contentBlock = this.shadowRoot.querySelector('#window-content');
  }

  bindEvents() {
    this.addEventListener('mousedown', (e) => { this.focus(); });
    this.addEventListener('created', (e) => { this.focus(); });
    
    this.shadowRoot.querySelector('.window-title')
      .addEventListener('mousedown', (e) => { this.titleMouseDown(e); });

    this.menuButton.addEventListener('click', (e) => { this.menuButtonClicked(e); });
    this.minButton.addEventListener('click', (e) => { this.minButtonClicked(e); });
    this.maxButton.addEventListener('click', (e) => { this.maxButtonClicked(e); });
    this.pinButton.addEventListener('click', (e) => { this.pinButtonClicked(e); });
    this.resizeButton.addEventListener('mousedown', (e) => { this.resizeMouseDown(e); });
    this.closeButton.addEventListener('click', (e) => { this.closeButtonClicked(e); });
    this.addEventListener('keyup', (e) => { this.onKeyUp(e); });
  }
  
  onKeyUp(evt) {
    var char = String.fromCharCode(evt.keyCode || evt.charCode);
    if (evt.altKey && char == "W") {
      if (confirm("close window?")) this.remove()
      evt.preventDefault();
    }
  }

  setup() {
    this.dragging = false;
    this.defineShortcuts();
    this.bindEvents();
  }

  /*
   * Window methods
   */
  render() {
    if (this.created) {
      if (this.attributes['title']) {
        this.titleSpan.innerHTML = this.attributes['title'].value.slice(0, 50);
      }
    }
  }

  reposition() {
    let rect = this.getBoundingClientRect();

    if (this.isFixed) {
      this.setPosition(rect.left, rect.top);

      this.classList.add('window-fixed');
      this.pinButton.classList.add('active');
    } else {
      let scroll = getScroll();

      this.setPosition(rect.left + scroll.x, rect.top + scroll.y);

      this.classList.remove('window-fixed');
      this.pinButton.classList.remove('active');
    }
  }

	get minZIndex() {
		return 100
	}
	
	allWindows() {
		return Array.from(document.querySelectorAll('lively-window'));
	}

  focus(e) {
    let allWindows = this.allWindows();
    let thisIdx = allWindows.indexOf(this);

    let allWindowsButThis = allWindows;
    allWindowsButThis.splice(thisIdx, 1);

    allWindowsButThis.sort((a, b) => {
      return parseInt(a.style['z-index']) - parseInt(b.style['z-index']);
    });

    allWindowsButThis.forEach((win, index) => {
      win.style['z-index'] = this.minZIndex + index;
      if (win.window)
        win.window.classList.remove('focused');
      win.removeAttribute('active');
    });
    
    this.style['z-index'] = this.minZIndex + allWindowsButThis.length;
    this.window.classList.add('focused');
    this.setAttribute('active', true);
    
    this.bringMinimizedWindowsToFront()
    
    if (this.target) this.target.focus()
  }



	bringMinimizedWindowsToFront() {
	  var allWindows = this.allWindows();
		allWindows.filter(ea => ea.isMinimized()).forEach( ea => {
      ea.style['z-index'] = this.minZIndex + allWindows.length +1
    });
	}
	
  minButtonClicked(e) {
    this.toggleMinimize()
  }

  maxButtonClicked(e) {
    this.toggleMaximize()
  }

  toggleMaximize() {
    if (this.positionBeforeMaximize) {
      $('i', this.maxButton).removeClass('fa-compress').addClass('fa-expand');

      this.style.position = "absolute"
      this.setPosition(
          this.positionBeforeMaximize.x,
          this.positionBeforeMaximize.y
      );
      this.setSize(
        this.positionBeforeMaximize.width,
        this.positionBeforeMaximize.height
      );
      document.body.style.overflow = this.positionBeforeMaximize.bodyOverflow

      this.positionBeforeMaximize = null
    } else {
      if (this.isMinimized()) {
        this.toggleMinimize()
      }

      $('i', this.maxButton).removeClass('fa-expand').addClass('fa-compress');

      var bounds = this.getBoundingClientRect()
      this.positionBeforeMaximize = {
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
        bodyOverflow: document.body.style.overflow
      }

      this.style.position = "fixed"
      this.style.top = 0;
      this.style.left = 0;
      this.style.width = "100%";
      this.style.height= "100%";
      document.body.style.overflow = "hidden"

    }
    this.bringMinimizedWindowsToFront()
    this.displayResizeHandle(!this.isMaximized())
  }

  displayResizeHandle(bool) {
    if (bool === undefined) bool = true;
    this.shadowRoot.querySelector('.window-resize').style.display =
      bool ? "block" : "none";
  }

  toggleMinimize() {
    // this.style.display = this.isMinimized() ?
    //   'block' : 'none';
      
    // if(this.isMinimized())
    //   this.removeAttribute('active');
      
      
    var content = this.shadowRoot.querySelector('#window-content');
    if (this.positionBeforeMinimize) {
      this.style.position = "absolute"
      this.setPosition(
          this.positionBeforeMinimize.x,
          this.positionBeforeMinimize.y
      );
      this.setSize(
        this.positionBeforeMinimize.width,
        this.positionBeforeMinimize.height
      );  
      content.style.display = "block";
      this.displayResizeHandle(true)
      this.positionBeforeMinimize = null
      
      // this.classList.removed("minimized")
    } else {
      if (this.isMaximized()) {
        this.toggleMaximize()
      }
      this.style['z-index'] = 100
      var bounds = this.getBoundingClientRect();
      this.positionBeforeMinimize = {
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
    
      this.style.position = "fixed";
      this.style.top = this.minimizedWindowPadding +"px";
      this.style.left = "";
      this.style.right = this.minimizedWindowPadding + "px";
      this.style.width = "300px";
      this.style.height= "30px";
      content.style.display = "none";
      this.displayResizeHandle(false)
      
      this.sortMinimizedWindows();
    }
    this.bringMinimizedWindowsToFront()
  }

  sortMinimizedWindows() {
    var x = 100;
    var windowBarHeight = this.shadowRoot.querySelector('.window-titlebar').clientHeight
    
    _.filter(document.body.querySelectorAll("lively-window"), ea => ea.isMinimized()).forEach(ea => {
      ea.style.top= x + "px" ;
      x += windowBarHeight + this.minimizedWindowPadding
    })
  }

  isMinimized() {
    return !!this.positionBeforeMinimize
  }

  isMaximized() {
    return !!this.positionBeforeMaximize;
  }

  pinButtonClicked(e) {
    let isPinned = this.pinButton.classList.toggle('active');
    if (isPinned) {
      this.setAttribute('fixed', '');
      this.style.position = "fixed" // does not seem to work with css? #Jens
    } else {
      this.removeAttribute('fixed');
      this.style.position = "absolute" // does not seem to work with css? #Jens

    }
    // this.reposition()
  }

  get target() {
    return this.childNodes[0]
  }

  closeButtonClicked(e) {
    if (this.target && this.target.unsavedChanges && this.target.unsavedChanges()) {
      if(!window.confirm("Window contains unsaved changes, close anyway?"))  {
        return 
      }
    }
    
    if (this.positionBeforeMaximize)
      this.toggleMaximize()

    this.parentNode.removeChild(this);
  }

  menuButtonClicked(e) {
    lively.openContextMenu(document.body, e, this.childNodes[0]);
  }

  titleMouseDown(e) {
    e.preventDefault();

    if(this.positionBeforeMaximize) return; // no dragging when maximized

    if (this.isFixed) {
      let offsetWindow =  this.getBoundingClientRect()
      this.dragging = {
        left: e.pageX - offsetWindow.left,
        top: e.pageY - offsetWindow.top
      };
    } else {
      this.draggingStart = lively.getPosition(this)
      if (isNaN(this.draggingStart.x) || isNaN(this.draggingStart.y)){
        throw new Error("Drag failed, because window Position is not a number")
      }
      this.dragging = {
        left: e.clientX,
        top: e.clientY
      };
    }
    this.startMyDrag()
    this.window.classList.add('dragging');
  }

  startMyDrag() {
    lively.removeEventListener('lively-window', document)
    
    lively.addEventListener('lively-window', document, 'mousemove', (e) => { this.windowMouseMove(e); });
    lively.addEventListener('lively-window', document, 'mouseup', (e) => { this.windowMouseUp(e); });
  } 

  stopMyDrag() {
    lively.removeEventListener('lively-window', document)
  } 


  resizeMouseDown(e) {
    e.preventDefault();

    let offsetWindow = $(this).offset();

    this.resizing = {
      left: offsetWindow.left,
      top: offsetWindow.top
    };

    this.window.classList.add('resizing');
    this.startMyDrag()
  }

  windowMouseUp(e) {
    e.preventDefault();

    this.dragging = false;
    this.resizing = false;

    this.window.classList.remove('dragging');
    this.window.classList.remove('resizing');
    
    this.stopMyDrag()
  }

  windowMouseMove(e) {
    if (this.dragging) {
      e.preventDefault();

      if (this.isFixed) {
        this.setPosition(
          e.clientX - this.dragging.left,
          e.clientY - this.dragging.top
        );
      } else {
        let scroll = getScroll();
        this.setPosition(
          this.draggingStart.x + e.pageX - this.dragging.left - scroll.x,
          this.draggingStart.y + e.pageY - this.dragging.top - scroll.y
        );
      }
    } else if (this.resizing) {
      e.preventDefault();
      this.setSize(
        e.pageX - this.resizing.left,
        e.pageY - this.resizing.top
      );
    }
  }

  /*
   * Public interface
   */
  centerInWindow() {
    let bounds = this.getBoundingClientRect();
    var s= getScroll();

    lively.setPosition(this,
      pt(s.x + document.body.clientWidth / 2 - bounds.width /2,
        s.y + document.body.clientHeight / 2 - bounds.height  /2));
  }

  /*
   * Live Programming / Instance Migration
   */
  livelyMigrate(oldInstance) {
    // this is crucial state
    this.positionBeforeMaximize = oldInstance.positionBeforeMaximize;
    this.positionBeforeMinimize = oldInstance.positionBeforeMinimize;
  }
  
  /*
   * embed content in parent and remove yourself
   */
  embedContentInParent() {
  	var content = this.querySelector("*")
  	var pos = lively.getPosition(this);
  	this.parentElement.appendChild(content);
  	lively.setPosition(content, pos);
  	this.remove()
  }


}
