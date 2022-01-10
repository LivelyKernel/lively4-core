/*MD # Window

![](lively-window.png){height=200}

MD*/


import Morph from 'src/components/widgets/lively-morph.js';
import { pt } from 'src/client/graphics.js';
import { Grid } from 'src/client/morphic/snapping.js';
import Preferences from 'src/client/preferences.js';
import LivelyTabsWrapper from 'src/components/widgets/lively-tabs-wrapper.js';

// #TODO extract
function getPointFromAttribute(element, attrX, attrY) {
  var x = element.getAttribute(attrX)
  var y = element.getAttribute(attrY)
  return pt(parseFloat(x), parseFloat(y))
}

function setPointToAttribute(element, attrX, attrY,  p) {
  element.setAttribute(attrX, p.x)
  element.setAttribute(attrY, p.y)
}

export default class Window extends Morph {
  
  static allWindows() {
    return Array.from(document.querySelectorAll('*')).filter(ea => ea.isWindow);
  }
  /*MD ## Getter / Setter MD*/
  get title() {
    return this._title
  }
  set title(val) {
    this._title = val
    this.render();
  }
  get isWindow() { return true }
  get minimizedWindowWidth() { return 300 }
  get minimizedWindowPadding() { return 10 }

  get active() { return this.hasAttribute('active') }
  get isFixed() { return this.hasAttribute('fixed') }
  get titleSpan() { return this.get('.window-title span') }
  get target() { return this.childNodes[0] }
  get window() { return this.get('.window') }
  get maxButton() { return this.get('.window-max') }
  get windowTitle() { return this.get('.window-title') }

  get minZIndex() {
    return 100
  }
  
  setExtent(extent) {
    lively.setExtent(this, extent)
    if (this.target)
      this.target.dispatchEvent(new CustomEvent("extent-changed"))
  }
  /*MD ## Setup MD*/
  
  initialize() {
    this.setup();

    this.created = true;
    this.render();

    if (this.isMinimized() || this.isMaximized())
      this.displayResizeHandle(false);

    this._attrObserver = new MutationObserver(mutations => {
	    mutations.forEach(mutation => {
        if(mutation.type == "attributes") {
          this.attributeChangedCallback(
            mutation.attributeName,
            mutation.oldValue,
            mutation.target.getAttribute(mutation.attributeName)
          )
        }
      });
    });
    this._attrObserver.observe(this, { attributes: true });
    
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

  bindEvents() {
    try {
      this.addEventListener('created', (evt) => this.focus());
      this.addEventListener('extent-changed', (evt) => { this.onExtentChanged(); });
      this.windowTitle.addEventListener('pointerdown', (evt) => { this.onTitleMouseDown(evt) });
      this.windowTitle.addEventListener('dblclick', (evt) => { this.onTitleDoubleClick(evt) });
      this.addEventListener('mousedown', (evt) => lively.focusWithoutScroll(this), true);
      this.get('.window-menu').addEventListener('click', evt => { this.onMenuButtonClicked(evt); });
      this.get('.window-min').addEventListener('click', evt => { this.onMinButtonClicked(evt); });
      this.get('.window-unmin').addEventListener('click', evt => { this.onMinButtonClicked(evt); });

      this.maxButton.addEventListener('click', evt => { this.onMaxButtonClicked(evt); });
      this.addEventListener('dblclick', evt => { this.onDoubleClick(evt); });
      this.get('.window-close').addEventListener('click', evt => { this.onCloseButtonClicked(evt); });
      this.addEventListener('keyup', evt => { this.onKeyUp(evt); });
    } catch (err) {
      console.log("Error, binding events! Continue anyway!", err)
    }
  }



  setup() {
    this.dragging = false;
    this.bindEvents();
  }

 
  /*MD ## Window MD*/
  
  isFullscreen() {
    return this.get(".window-titlebar").style.display == "none"
  }

  isMinimized() {
    return this.classList.contains("minimized")
  }

  isMaximized() {
    return this.classList.contains("maximized")
  }
  
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
      lively.setPosition(this, pos);
      this.classList.add('window-fixed');
    } else {
      lively.setPosition(this, pos.addPt(lively.getScroll()))
      this.classList.remove('window-fixed')
    }
  }


  allWindows() {
    return Window.allWindows()
  }

  hideTitlebar() {
    this.get(".window-titlebar").style.display = "none"
  }

  showTitlebar() {
    this.get(".window-titlebar").style.display = ""
  }

  focus() {
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

    if (this.isFullscreen()) {
      // fullscreen and everything is in front of me...
      this.style['z-index'] = 0;
    } else {
      this.style['z-index'] = this.minZIndex + allWindowsButThis.length;

    }

    this.window.classList.add('focused');
    this.setAttribute('active', true);

    // this.bringMinimizedWindowsToFront()

    if (this.target && this.target.focus) this.target.focus()
  }

  bringMinimizedWindowsToFront() {
    var allWindows = this.allWindows();
    allWindows.filter(ea => ea.isMinimized()).forEach(ea => {
      ea.style['z-index'] = this.minZIndex + allWindows.length + 1
    });
  }
  
  
  
  getAddOnRoot() {
    return this.shadowRoot.querySelector("#window-global")
  }

  /* embed content in parent and remove yourself */
  embedContentInParent() {
    var content = this.querySelector("*")
    var pos = lively.getPosition(this);
    this.parentElement.appendChild(content);
    lively.setPosition(content, pos);
    this.remove()
  }

  
  detachedCallback() {
    if (this.isMaximized()) {
      document.body.style.overflow = this.getAttribute("prev-overflow")
    }
  }
  
  /*MD ## Maximize/Minimize MD*/

  // #important
  toggleMaximize() {
    var content = this.get('#window-content');
    var maxButtonI = this.maxButton.querySelector('i')
    if (this.isMaximized()) {
      this.restoreExtentAndPosition()
      
      maxButtonI.classList.remove('fa-compress')
      maxButtonI.classList.add('fa-expand');
      
      content.style.display = "block";
      document.body.style.overflow = this.getAttribute("prev-overflow")
      this.classList.remove("maximized")
    } else {
      if (this.isMinimized()) {
        return this.toggleMinimize()
      }

      maxButtonI.classList.add('fa-compress')
      maxButtonI.classList.remove('fa-expand');

      
      this.storeExtentAndPosition()
      this.setAttribute("prev-overflow", document.body.style.overflow)

      this.style.position = "fixed"
      this.style.top = 0;
      this.style.left = 0;
      this.style.width = "100%";
      this.style.height = "100%";
      document.body.style.overflow = "hidden"
      if (this.target)
        this.target.dispatchEvent(new CustomEvent("extent-changed"))
      
      this.classList.add("maximized")
    }
    this.bringMinimizedWindowsToFront()
    this.displayResizeHandle(!this.isMaximized())
  }

  displayResizeHandle(bool) {
    if (bool === undefined) bool = true;
    this.getAllSubmorphs('lively-resizer').forEach(ea => {
      ea.style.display = bool ? "block" : "none";
    })
  }
  
  
  storeExtentAndPosition() {
    setPointToAttribute(this, "prev-left", "prev-top", lively.getPosition(this))
    setPointToAttribute(this, "prev-width", "prev-height", lively.getExtent(this))
  }
  

  restoreExtentAndPosition() {
    lively.setPosition(this, getPointFromAttribute(this, "prev-left", "prev-top"))
    lively.setExtent(this, getPointFromAttribute(this, "prev-width", "prev-height"))            
  }

  // #important
  toggleMinimize() {

    var content = this.get('#window-content');
    if (this.classList.contains("minimized")) {
      
      // min -> normal
      
      this.displayResizeHandle(true)
      
      setPointToAttribute(this, "prev-min-left", "prev-min-top", lively.getPosition(this))
      this.restoreExtentAndPosition()
      
      this.classList.remove("minimized")

      content.style.display = "block";
      // restore title
      this.setAttribute("title", this.getAttribute("prev-title"))
      
      this.target.style.display = ""
      content.style.pointerEvents = ""

    } else {
      if (this.isMaximized()) {
        return this.toggleMaximize()
      }
      
      // normal -> min
      
      this.storeExtentAndPosition()
      lively.setPosition(this, getPointFromAttribute(this, "prev-min-left", "prev-min-top"))
      
      this.setAttribute("prev-title", this.getAttribute("title"))

      // update title
      var minTitle = this.getAttribute("title") + " (minimized)"      
      if (this.target.livelyMinimizedTitle) {
        minTitle = this.target.livelyMinimizedTitle()
      }
      this.setAttribute("title",  minTitle )
      var titleExtent = lively.getExtent(this.get(".window-titlebar"))
      lively.setExtent(this, pt(400, titleExtent.y + 4))
      
      this.classList.add("minimized")
      this.target.style.display = "none"
      content.style.pointerEvents = "none"
      this.displayResizeHandle(false)
    }
    this.bringMinimizedWindowsToFront()
  }
  


  
  // #depricated #notused 
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
  /*MD ## Events MD*/

  onMinButtonClicked(evt) {
    if (evt.shiftKey) {
      document.scrollingElement.scrollTop = 0
      document.scrollingElement.scrollLeft = 0
      lively.moveBy(document.body, lively.getGlobalPosition(this).scaleBy(-1))
      lively.setExtent(this, lively.getExtent(this).withY(window.innerHeight - 8))
    } else {
      this.toggleMinimize()
    }
    evt.stopPropagation()
  }

  onMaxButtonClicked(evt) {
    if (evt.shiftKey) {
      this.togglePined()
    } else {
      this.toggleMaximize()
    }
  }

  onMenuButtonClicked(evt) {
    lively.openContextMenu(document.body, evt, this.target);
  }

  onTitleMouseDown(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    lively.focusWithoutScroll(this)

    if (this.positionBeforeMaximize) return; // no dragging when maximized

    if (this.isFixed) {
      let offsetWindow = this.getBoundingClientRect()
      this.dragging = pt(evt.pageX - offsetWindow.left, evt.pageY - offsetWindow.top)

    } else {
      this.draggingStart = lively.getPosition(this)
      if (isNaN(this.draggingStart.x) || isNaN(this.draggingStart.y)) {
        throw new Error("Drag failed, because window Position is not a number")
      }
      this.dragging = pt(evt.clientX, evt.clientY)
    }
    lively.removeEventListener('lively-window-drag', this.windowTitle)
    
    lively.addEventListener('lively-window-drag', document.documentElement, 'pointermove',
      evt => this.onWindowMouseMove(evt), true);
    lively.addEventListener('lively-window-drag', document.documentElement, 'pointerup',
      evt => this.onWindowMouseUp(evt));
    this.window.classList.add('dragging', true);
  }

  async onCloseButtonClicked(evt) {
    if (this.target && this.target.unsavedChanges && this.target.unsavedChanges()) {
      if (!await lively.confirm("Window contains unsaved changes, close anyway?")) {
        return
      }
    }
    if (this.positionBeforeMaximize)
      this.toggleMaximize()

    this.parentNode.removeChild(this);
    if (this.afterWindowClosed instanceof Function) {
      this.afterWindowClosed();
    }
    
    var last = this.allWindows().first
    if (last) {
      lively.focusWithoutScroll(last)
    }
  }
  
  onWindowMouseMove(evt) {
    // lively.showEvent(evt)
    
    if (this.dragging) {
      evt.preventDefault();
      evt.stopPropagation();
      
      if (this.isFixed) {
        lively.setPosition(this, pt(evt.clientX, evt.clientY).subPt(this.dragging));
      } else {
        
        // Calculate collision of windows.
        var focusedWindowPos = lively.getPosition(this);
        var allWindows = this.allWindows();
        for (var i = 0; i < allWindows.length; i++) {
          var otherWindow = allWindows[i];
          
          // As observed, this line is basically useless.
          if (this !== otherWindow) {
            
            // Check if the window collides & if it has not previously collided.
            if (this.collidesWith(otherWindow)) {
              // Collision of Windows
              /*
              lively.create("lively-window")
                .then( (windowOfWrapper) => {                  
                  lively.create("lively-tabs-wrapper")
                    .then( (wrapper) => {
                    
                      
                      wrapper.addWindow(otherWindow)
                        .then(() => {
                          
                          wrapper.addWindow(this)
                          .then(() => {
                                                        
                            windowOfWrapper.get("#window-content").appendChild(wrapper);
                            // TODO: I'm sure this line can be replaced with something which corresponds more with the lively API
                            document.body.appendChild(windowOfWrapper);
                            // TODO: Remove both windows and have the only in the Wrapper
                            
                          });
                        });
                    
                    });
                });
              */
            }            
            
          }
        }
          
        var pos = this.draggingStart.addPt(pt(evt.pageX, evt.pageY))
          .subPt(this.dragging).subPt(lively.getScroll())
        lively.setPosition(this, Grid.optSnapPosition(pos, evt))
      }
    }
  }
  
  /*
  Determines, whether two windows collide or not (returns true or false). 
  
  A window collides with another window if and only if the top right corner is within the window 
  titlebar.
  */
  collidesWith(otherWindow) {
    
    var focusedWindowPos = lively.getPosition(this);
    var otherWindowPos = lively.getPosition(otherWindow);
    
    if (focusedWindowPos.x > otherWindowPos.x && 
        focusedWindowPos.x < otherWindowPos.x + parseInt(otherWindow.style.width)) {
      // Collision in horizontal dimension detected
              
      // The height of the titlebar is always set to 1.2 em. The following converts that to px.
      var otherWindowTitlebarHeight = parseFloat(getComputedStyle(otherWindow).fontSize);
                      
      if (focusedWindowPos.y > otherWindowPos.y &&
          focusedWindowPos.y < otherWindowPos.y + otherWindowTitlebarHeight) {
        return true;
      }
              
    }
    return false;
    
  }

  onWindowMouseUp(evt) {
    evt.preventDefault();
    this.dragging = false;
    // this.windowTitle.releasePointerCapture(evt.pointerId)
    this.window.classList.remove('dragging');
    this.window.classList.remove('resizing');
    lively.removeEventListener('lively-window-drag',  document.documentElement)
  }

  onExtentChanged(evt) {
    if (this.target) {
      this.target.dispatchEvent(new CustomEvent("extent-changed"));
    }
  }

  onDoubleClick(evt) {
    if (this.isMinimized()) {
      this.toggleMinimize()
    }
  }

  onTitleDoubleClick(evt) {
    this.toggleMaximize()
    evt.stopPropagation()
  }

  
  onKeyUp(evt) {
    var char = String.fromCharCode(evt.keyCode || evt.charCode);
    if ((evt.altKey) && char == "W") { // is this  "evt.ctrlKey" used unter Mac? , it makes problems under Windows
      this.onCloseButtonClicked(evt)
      evt.preventDefault();
    }
  }
  
  /*MD ## Hooks MD*/
  
  livelyMigrate(oldInstance) {
    // this is crucial state
  }


}
