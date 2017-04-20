import Morph from './Morph.js';
import {Grid,pt} from 'src/client/graphics.js'

import Preferences from 'src/client/preferences.js';

// #TODO implement this again with the new AExp lib #Stefan? 
// import { AExpr } from 'src/external/active-expressions/src/active-expressions.js';
// import { AExpr } from 'src/external/active-expressions/src/active-view.js';

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

  get target() {
    return this.childNodes[0]
  }

  setExtent(extent) {
    lively.setExtent(this, extent)
    if (this.target) 
      this.target.dispatchEvent(new CustomEvent("extent-changed"))
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
  
  attachedCallback() {
    if (this.parentElement === document.body) {
       this.classList.add("global")
    } else {
       this.classList.remove("global")
    }
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    switch (attrName) {
      case 'title':
        this.render();
        break;
      case 'icon':
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

    this.contentBlock = this.shadowRoot.querySelector('#window-content');
  }

  bindEvents() {
    try {
      this.addEventListener('created', (evt) => this.focus());
      this.addEventListener('extent-changed', (evt) => { this.onExtentChanged(); });
      this.shadowRoot.querySelector('.window-title')
        .addEventListener('mousedown', (evt) => { this.onTitleMouseDown(evt); });
      this.addEventListener('mousedown', (evt) => this.focus(), true);
      this.menuButton.addEventListener('click', evt => { this.onMenuButtonClicked(evt); });
      this.minButton.addEventListener('click', evt => { this.onMinButtonClicked(evt); });
      this.maxButton.addEventListener('click', evt => { this.onMaxButtonClicked(evt); });
      this.get('.window-close').addEventListener('click', evt => { this.onCloseButtonClicked(evt); });
      this.addEventListener('keyup', evt => { this.onKeyUp(evt); });
    } catch(err) {
      console.log("Error, binding events! Continue anyway!", err)
    }
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
      var icon = this.attributes['icon'];
      var title = this.attributes['title'];
      var content = '';
      if (icon && title) {
        content = icon.value + ' ' + title.value.slice(0, 50);
      } else if (icon) {
        content = icon.value;
      } else if (title) {
        content = title.value.slice(0, 50);
      }
      this.titleSpan.innerHTML = content;
    }
  }

  reposition() {
    let pos = lively.getGlobalPosition(this);
    if (this.isFixed) {
      lively.setPosition(pos);
      this.classList.add('window-fixed');
    } else {
      lively.setPosition(pos.addPt(lively.getScroll()))
      this.classList.remove('window-fixed') 
    }
  }

	get minZIndex() {
		return 100
	}
	
  allWindows() {
    return Window.allWindows()
	}

  static allWindows() {
    return Array.from(document.querySelectorAll('*')).filter(ea => ea.isWindow);
	}

  focus(evt) {
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
    
    if (this.target && this.target.focus) this.target.focus()
  }

	bringMinimizedWindowsToFront() {
	  var allWindows = this.allWindows();
		allWindows.filter(ea => ea.isMinimized()).forEach( ea => {
      ea.style['z-index'] = this.minZIndex + allWindows.length +1
    });
	}
	
  minButtonClicked(evt) {
    this.toggleMinimize()
  }

  maxButtonClicked(evt) {
    if (evt.shiftKey) {
      this.togglePined() 
    } else {
      this.toggleMaximize()
    }
  }

  toggleMaximize() {
    if (this.positionBeforeMaximize) {
      $('i', this.maxButton).removeClass('fa-compress').addClass('fa-expand');

      this.style.position = "absolute"
      lively.setGlobalPosition(this, 
        pt(this.positionBeforeMaximize.x, this.positionBeforeMaximize.y)
      );
      this.setExtent(pt(this.positionBeforeMaximize.width, this.positionBeforeMaximize.height))
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
    this.shadowRoot.querySelector('lively-resizer').style.display =
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
      lively.setGlobalPosition(this, 
        pt(this.positionBeforeMinimize.x, this.positionBeforeMinimize.y)
      );
      this.setExtent(pt(this.positionBeforeMinimize.width, this.positionBeforeMinimize.height));  
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

  togglePined() {
    let isPinned = this.style.position == "fixed"
    if (isPinned) {
      this.removeAttribute('fixed');
      this.style.position = "absolute" // does not seem to work with css? #Jens
    } else {
      this.setAttribute('fixed', '');
      this.style.position = "fixed" // does not seem to work with css? #Jens
    }
  }


  onCloseButtonClicked(evt) {
    if (this.target && this.target.unsavedChanges && this.target.unsavedChanges()) {
      if(!window.confirm("Window contains unsaved changes, close anyway?"))  {
        return 
      }
    }
    if (this.positionBeforeMaximize)
      this.toggleMaximize()

    this.parentNode.removeChild(this);
  }

  onMenuButtonClicked(evt) {
    lively.openContextMenu(document.body, evt, this.childNodes[0]);
  }

  onTitleMouseDown(evt) {
    evt.preventDefault();

    if(this.positionBeforeMaximize) return; // no dragging when maximized

    if (this.isFixed) {
      let offsetWindow =  this.getBoundingClientRect()
      this.dragging = pt(evt.pageX - offsetWindow.left, evt.pageY - offsetWindow.top)

    } else {
      this.draggingStart = lively.getPosition(this)
      if (isNaN(this.draggingStart.x) || isNaN(this.draggingStart.y)){
        throw new Error("Drag failed, because window Position is not a number")
      }
      this.dragging = pt(evt.clientX, evt.clientY)
    }
        lively.removeEventListener('lively-window', document)
    
    lively.addEventListener('lively-window', document, 'mousemove', 
      evt => this.onWindowMouseMove(evt));
    lively.addEventListener('lively-window', document, 'mouseup', 
      evt => this.onWindowMouseUp(evt));
    this.window.classList.add('dragging');
  }

  onWindowMouseMove(evt) {
    if (this.dragging) {
      evt.preventDefault();

      if (this.isFixed) {
        lively.setPosition(this, pt(evt.clientX, evt.clientY).subPt(this.dragging));
      } else {
        var pos = this.draggingStart.addPt(pt(evt.pageX, evt.pageY))
          .subPt(this.dragging).subPt(lively.getScroll())
        lively.setPosition(this, Grid.optSnapPosition(pos, evt))
      }
    }
  }

  onWindowMouseUp(evt) {
    evt.preventDefault();
    this.dragging = false;

    this.window.classList.remove('dragging');
    this.window.classList.remove('resizing');
    lively.removeEventListener('lively-window', document)
  }

  onExtentChanged(evt) {
    if (this.target) {
      this.target.dispatchEvent(new CustomEvent("extent-changed"))
    }
  }

  livelyMigrate(oldInstance) {
    // this is crucial state
    this.positionBeforeMaximize = oldInstance.positionBeforeMaximize;
    this.positionBeforeMinimize = oldInstance.positionBeforeMinimize;
  }
  
  /* embed content in parent and remove yourself */
  embedContentInParent() {
  	var content = this.querySelector("*")
  	var pos = lively.getPosition(this);
  	this.parentElement.appendChild(content);
  	lively.setPosition(content, pos);
  	this.remove()
  }


}
