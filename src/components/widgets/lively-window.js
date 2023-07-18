/*MD # Window

Authors: @JensLincke @onsetsu @Nsgr @wolv3rine876 @rrcomtech @MerlindlH

Keywords: #Widget #Core #Lively4 #PX #Seminar

![](lively-window.png){height=200}

MD*/


import Morph from 'src/components/widgets/lively-morph.js';  
import { pt } from 'src/client/graphics.js';
import { Grid } from 'src/client/morphic/snapping.js';
import Preferences from 'src/client/preferences.js';

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
    return this.getAttribute("title")
  }
  set title(val) {
    this.setAttribute("title", val)
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
  
  get isClosed() { return !this.parentElement }

  get minZIndex() {
    return 100
  }
  // time (in ms) to wait until a tab is created when dropping
  get tabbingTimeThreshold() { return 700; }
  get tabBar() {
    return this.get("#tab-bar-identifier");
  }
  
  setExtent(extent) {
    lively.setExtent(this, extent)
    if (this.target)
      this.target.dispatchEvent(new CustomEvent("extent-changed"))
  }
  /*MD ## Setup MD*/
  
  initialize() {
    if (this.hasAttribute('for-preload')) {
      return;
    }
    
    this.ensureInitialized()
  }

  ensureInitialized() {
    if (this._initialized) {
      return;
    } else {
      this._initialized = true;
    }

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
    
    this.setAttribute("tabindex", 0);
    
    this.setTabBar(this.formerTabs);
    
  }

  attachedCallback() {
    if (this.hasAttribute('for-preload')) {
      return;
    }
    
    if (this.parentElement === document.body) {
      this.classList.add("global")
    } else {
      this.classList.remove("global") 
    }
  } 

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (this.hasAttribute('for-preload')) {
      return;
    }
    
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
      this.addEventListener('extent-changed', evt => { this.onExtentChanged(); });
      this.windowTitle.addEventListener('pointerdown', evt => { this.onTitleMouseDown(evt) });
      this.windowTitle.addEventListener('dblclick', evt => { this.onTitleDoubleClick(evt) });
      this.addEventListener('mousedown', evt => lively.focusWithoutScroll(this), true);
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
  
  isDocked() {
    return this.classList.contains("docked")
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
    let pos = lively.getClientPosition(this);
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
    if (this.hasAttribute('for-preload')) {
      return;
    }
    
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
      this.setAttribute("title", this.getAttribute("prev-title"));
      
      this.target.style.display = ""
      content.style.pointerEvents = ""

    } else {
      if (this.isMaximized()) {
        return this.toggleMaximize()
      }
      
      // normal -> min
      
      this.storeExtentAndPosition()
      lively.setPosition(this, getPointFromAttribute(this, "prev-min-left", "prev-min-top"))
      
      // set title
      var prevTitle = this.getAttribute("title") != null ? this.getAttribute("title") : "";
      this.setAttribute("prev-title", prevTitle);
      
      // update title
      var minTitle = this.getAttribute("title") + " (minimized)";
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
  


  
  // #deprecated #notused 
  togglePinned() {
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
      lively.moveBy(document.body, lively.getClientPosition(this).scaleBy(-1))
      lively.setExtent(this, lively.getExtent(this).withY(window.innerHeight - 8))
    } else {
      this.toggleMinimize()
    }
    evt.stopPropagation()
  }

  onMaxButtonClicked(evt) {
    if (evt.shiftKey) {
      this.togglePinned()
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

    if (this.positionBeforeMaximize) return; // no dragging when maximized @TODO change

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
      async evt => await this.onWindowMouseUp(evt));
    this.window.classList.add('dragging', true);
  }

  async onCloseButtonClicked(evt) {
    
    if (await this.saveTabsOnClose()) {
      return;
    }
    
    if (this.target && this.target.unsavedChanges && this.target.unsavedChanges()) {
      if (await this.askToCloseWindow()) return;
    }
    if (this.positionBeforeMaximize)
      this.toggleMaximize()

    this.parentNode.removeChild(this);
    if (this.afterWindowClosed instanceof Function) {
      this.afterWindowClosed();
    }
    
    this.undockMe();
    this.setAttribute('closed', true);
    
    var last = this.allWindows().first
    if (last) {
      lively.focusWithoutScroll(last)
    }
  }  
  
  
  onWindowMouseMove(evt) {    
    //lively.showEvent(evt)
    
    if (this.dragging) {
      evt.preventDefault();
      evt.stopPropagation();
      
      this.undockMe();

      if (this.isFixed) {
        lively.setPosition(this, pt(evt.clientX, evt.clientY).subPt(this.dragging));
      } else {
        if (lively.preferences.get("TabbedWindows")) {
          this.rememberWindowCollision(evt);
          this.checkDockingDrag(evt);
        }
        var pos = this.draggingStart.addPt(pt(evt.pageX, evt.pageY))
          .subPt(this.dragging).subPt(lively.getScroll())
        lively.setPosition(this, Grid.optSnapPosition(pos, evt))
      }
    }
  }
  

  async onWindowMouseUp(evt) {
    evt.preventDefault();
    this.dragging = false;

    if (lively.preferences.get("TabbedWindows")) {
      this.checkDockingDragEnd(evt);
    }
    
    // this.windowTitle.releasePointerCapture(evt.pointerId)
    this.window.classList.remove('dragging');
    this.window.classList.remove('resizing');
    lively.removeEventListener('lively-window-drag',  document.documentElement);
    
    if (this.dropintoOtherWindow) {
      await this.createTabsWrapper(evt);
    }
    this.dropintoOtherWindow = null;
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
  
  /*
    Returns: 
            true: The User confirmed ("clicked Ok")
            false: The User canceled ("clicked cancel")
  */
  async askToCloseWindow() {    
      return !( await lively.confirm("Window contains unsaved changes, close anyway?") );
  }
  

  
  // Docking
  
  /*MD ## Docking MD*/
  
  
  async checkDockingDrag(evt) {   
    if (!lively.windowDocking) return;
    lively.windowDocking.checkDraggedWindow(this, evt);
  }
  
  async checkDockingDragEnd(evt) {
    if (!lively.windowDocking) return;
    lively.windowDocking.checkReleasedWindow(this, evt);
  }
  
  dockTo(targetArea) {
    var content = this.get('#window-content');
      if (this.isMinimized()) {
        // @TODO this might not need a return
        return this.toggleMinimize()
      }
    // store extent and position
    // maybe go maximized mode
    
    if (!this.isDocked()) {
      this.storeExtentAndPosition();
    }

      this.setAttribute("prev-overflow", document.body.style.overflow)

      this.style.position = "fixed"
      this.style.top = targetArea.top() + "px";
      this.style.left = targetArea.left() + "px";
      this.style.width = targetArea.width + "px";
      this.style.height = targetArea.height + "px";
      document.body.style.overflow = "hidden"
      // @TODO I dont know why this is necessary yet
      if (this.target)
        this.target.dispatchEvent(new CustomEvent("extent-changed"))
      this.classList.add("docked")
    
    this.displayResizeHandle(!this.isDocked())
  }
  
  undockMe() {
    if (!lively.windowDocking) return;
    lively.windowDocking.undockMe(this);
  }
  /*MD ## Tabs MD*/
  /*
    Checks, if two windows collide. 
    If so, they are both inserted into a newly created Tabs-Wrapper.
    If one of the windows is already a tabs wrapper, the other one is inserted into it.
  */
  async createTabsWrapper(evt){
    
    const cursorX = evt.clientX;
    const cursorY = evt.clientY;      
    
    if (!this.dropintoOtherWindow) return;
    
    // Join windows if cursor was in pluswindow and one second is gone since
    // the cursor entered the window.
    var rect = this.plusSymbol.getBoundingClientRect();
    if(cursorX > rect.left && cursorX < rect.right &&
       cursorY > rect.top && cursorY < rect.bottom &&
       Date.now() - this.plusSymbol.addedTime > this.tabbingTimeThreshold) { 
      
      var otherWindow = this.dropintoOtherWindow;
      
      if (! (otherWindow.classList.contains("containsTabsWrapper") || this.classList.contains("containsTabsWrapper"))) {
        
        var wrapper = await (<lively-tabs-wrapper></lively-tabs-wrapper>);        
        var windowOfWrapper = await (<lively-window>{wrapper}</lively-window>);
        windowOfWrapper.classList.add("containsTabsWrapper");
        
        document.body.appendChild(windowOfWrapper);

        lively.setClientPosition(windowOfWrapper, lively.getClientPosition(otherWindow));
        lively.setPosition(windowOfWrapper, lively.getPosition(windowOfWrapper));
        lively.setExtent(windowOfWrapper, lively.getExtent(otherWindow));

        await wrapper.addWindow(otherWindow)
        await wrapper.addWindow(this)        
      } else {
        await this.joinWithTabsWrapper(otherWindow);
      }
    }
    
    if(this.plusSymbol) {
      this.hidePlusSymbol();
    }
    
  }
  
  async tabIntoWindow(otherWindow) {
      if (! (otherWindow.classList.contains("containsTabsWrapper") || this.classList.contains("containsTabsWrapper"))) {
        
        var wrapper = await (<lively-tabs-wrapper></lively-tabs-wrapper>);        
        var windowOfWrapper = await (<lively-window>{wrapper}</lively-window>);
        windowOfWrapper.classList.add("containsTabsWrapper");
        
        document.body.appendChild(windowOfWrapper);

        lively.setClientPosition(windowOfWrapper, lively.getClientPosition(otherWindow));
        lively.setPosition(windowOfWrapper, lively.getPosition(windowOfWrapper));
        lively.setExtent(windowOfWrapper, lively.getExtent(otherWindow));

        await wrapper.addWindow(otherWindow)
        await wrapper.addWindow(this)        
      } else {
        await this.joinWithTabsWrapper(otherWindow);
      }
  }
  
  
  
  async joinWithTabsWrapper(otherWindow) {
    /*
      When adding a window to a wrapper, there are 3 cases:
        (1) Win1 is a tabs wrapper, but win2 is not.
        (2) Win1 is not a tabs wrapper, but Win2 is one.
        (3) Both windows are tabs wrappers.
    */
    if (otherWindow.classList.contains("containsTabsWrapper") &&  this.classList.contains("containsTabsWrapper")) {
      // Case (3)
      // Get both wrappers
      var otherTW = otherWindow.get("lively-tabs-wrapper");
      var thisTW = this.get("lively-tabs-wrapper");
          
      // Merge both wrappers
      if (otherTW && thisTW) {
            
        var children = thisTW.children;
        var numberOfChildren = children.length;

        for (var childrenCounter = 0; childrenCounter < numberOfChildren; childrenCounter++) {
          const child = children[0];
          await otherTW.addContent(child, child.title);
        }
      }
      // Remove one of the wrappers
      this.remove();   
    } else {
          
      // Case (1) & (2)
      if (otherWindow.classList.contains("containsTabsWrapper")) {                          
        var existingWrapper = otherWindow.get("lively-tabs-wrapper");
        existingWrapper.addWindow(this);
      } else {
        if (this.classList.contains("containsTabsWrapper")) {
          let pos = lively.getPosition(otherWindow);
          var wrapperOfThisWindow = this.get("lively-tabs-wrapper");
          wrapperOfThisWindow.addWindow(otherWindow);
          lively.setPosition(this, pos);
        }
      }
          
    }        
  }
  
  async rememberWindowCollision(evt) {
    
    const cursorX = evt.clientX;
    const cursorY = evt.clientY;
    
    var tabbableWin = null;
    
    // Filter colliding windows whether they collide with the current window or not
    var allNonTabbedWindows = this.allWindows().filter( (win) => !win.classList.contains("tabbed") );
    var allCollidingWindows = allNonTabbedWindows.filter(function(win) {
    
      // Do not show the plus symbol for tabbed windows!
      if (win.classList.contains("tabbed")) {
        return true;
      }
      return this !== win &&  win.cursorCollidesWith && win.cursorCollidesWith( cursorX, cursorY, win );
    }, this);
    
    // Filter for windows, which do not lay on top. 
    if(allCollidingWindows && allCollidingWindows.length > 0) {
      // find win with max z-index
      self.lastCollidingWindow = allCollidingWindows;
      tabbableWin = allCollidingWindows.reduce(function(prev, current) {
        var zIndexPrev = parseInt(window.getComputedStyle(prev).getPropertyValue("z-index"));
        var zIndexCurrent = parseInt(window.getComputedStyle(current).getPropertyValue("z-index"));
        return (zIndexPrev > zIndexCurrent) ? prev : current;
      });
    }
    
    // Hide plusSymbol (drop area)
    if(this.plusSymbol && tabbableWin != this.dropintoOtherWindow) {
      this.hidePlusSymbol();
    }
    // Show plusSymbol (drop area)
    if(tabbableWin && tabbableWin != this.dropintoOtherWindow) {
      await this.showPlusSymbol( tabbableWin );
    }
    this.dropintoOtherWindow = tabbableWin;                                    
  }
  
  /*
  Demermines, whether the cursor is over a window or not
  */
  cursorCollidesWith(cursorX, cursorY, win){
    
    const otherWinPos = lively.getClientPosition(win);    
    const otherWinX = otherWinPos.x;
    const otherWinY = otherWinPos.y;
    const otherWinWidth = parseInt(win.style.width);
    const otherWinHeight = win.get('.window-titlebar').offsetHeight;
    
    if (cursorX > otherWinX && 
        cursorX < otherWinX + otherWinWidth &&
        cursorY > otherWinY &&
        cursorY < otherWinY + otherWinHeight) {
        // Cursor is in other window
        return true;              
    }
    return false;
  }
  
  async showPlusSymbol(otherWindow){
    
    // If the parent is a tabs wrapper (aka currently looking at a tab) --> dont show a window
    if (otherWindow.parentElement.nodeName === "LIVELY-TABS-WRAPPER") return;
    
    const otherWindowPosition = lively.getClientPosition(otherWindow);
    const w = parseInt(otherWindow.style.width);
    const h = parseInt(this.titleSpan.style.height);
    var progressBar = await (<div style="height:2px;width:100%;background-color:white;align-self:start;"/>);
    this.plusSymbol = (<div style={"width:" + w + "px;" + "" + "px;background-color:#778899;opacity:0.6;"}>
                         {progressBar}
                         <span style="font-size:16px;text-align:center;color:#ffffff;margin:auto;display:block">Add a new tab</span>
                       </div>);
    // start animations
    this.plusSymbol.animate([
        {opacity: 0},
        {opacity: 0.6},
      ], {
        duration: this.tabbingTimeThreshold
    });
    progressBar.animate([
      {width: 0},
      {width: w}
    ], {duration: this.tabbingTimeThreshold});
    // add to DOM
    document.body.appendChild(this.plusSymbol);
    this.plusSymbol.style.setProperty("position", "absolute");
    lively.setClientPosition(this.plusSymbol, otherWindowPosition);
    this.plusSymbol.style.setProperty("z-index", 100000);
    // Set time for threshold
    this.plusSymbol.addedTime = Date.now();
  }
  
  hidePlusSymbol() {
    this.plusSymbol.remove();
    this.plusSymbol = null;
  }
  
  async saveTabsOnClose() {
    
    if (!this.containsTabs()) return;
  
    let wrapper = this.getTabsWrapper();
    let tabsContents = wrapper.childNodes;
    
    for (let eaWin of tabsContents) {      
      if (eaWin && eaWin.unsavedChanges && eaWin.unsavedChanges()) {
        if (await this.askToCloseWindow()) {
          return true;
        } 
        // Do not ask multiple times for each tab.
        return false;
      }
    }
    return false;    
    
  }
  
  /*
    Allows to place a custom tab bar element.
  */ 
  setTabBar(newTabBar) {
    if (newTabBar) {
      let currTabBar = this.tabBar;
      currTabBar.parentElement.replaceChild(newTabBar, currTabBar); 
    }
  }
  
  getTabsWrapper() {
    if (this.containsTabs()) {
      return this.childNodes[0];
    }
    return null;
  }
   
  containsTabs() {
    return this.classList.contains("containsTabsWrapper");
  }
  
  /*MD ## Hooks MD*/
  
  livelyMigrate(oldInstance) {
    this.formerTabs = oldInstance.tabBar;
    oldInstance.style["z-index"] = oldInstance.style["z-index"]
    
    
  }

}
