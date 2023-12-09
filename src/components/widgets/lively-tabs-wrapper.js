"disable deepeval"

import Morph from 'src/components/widgets/lively-morph.js';
import {pt} from 'src/client/graphics.js'

export default class LivelyTabsWrapper extends Morph {
  
  /*MD ## Getter / Setter MD*/
  
  get tabBar() {
    return this.parentElement.get("#tab-bar-identifier");
  } 
  get tabs() {
    return Array.from(this.tabBar.children);
  }
  get numberOfWindows() {
    return this.childElementCount;
  }
  /*MD ## Setup MD*/
  
  initialize() { 
            
    // The tabs windows shall explicitly not contain any title.
    this.windowTitle = "";
    
    this.content = ""; 
    
    this.bindEvents();
    
    this.lastActions = [];
    
    
  }
  
  connectedCallback() {
    // Add tabs to tab list for every window (stored in DOM).
    // Each tab will be "re-created". Its previous version needs to be deleted.
    if (this.children.length > 0) {
      while(this.tabBar.firstChild) {
        this.tabBar.removeChild(this.tabBar.firstChild);
      }
      for(let ea of this.children) {
        this.addTab(ea); 
      }
      this.bringToForeground(this.getTabOnForeground());
    }
  }
  
  bindEvents(){
    this.registerButtons();
    
    lively.html.registerKeys(this); // automatically installs handler for some methods

    // Register event handlers
    lively.removeEventListener("tabs-wrappper", this.parentElement, "keydown");
    lively.addEventListener("tabs-wrappper", this.parentElement, "keydown", evt => this.onKeyDown(event), true);
    // Register observer
    new ResizeObserver(() => this.resizeContent(this)).observe(this);
  }
  
  /*MD ## Events MD*/
  
  /*
    Implements keyboard shortcuts
  */
  onKeyDown(evt) {
    // change tab on ctrl + q
    if (evt.ctrlKey && evt.key === 'q') {
      var nextTab = this.getFollowingTab(this.getTabOnForeground());
      this.bringToForeground(nextTab);
      evt.stopPropagation()
      evt.preventDefault()
    }
    if (evt.key ===  "Escape") {
      this.revertLastAction();
    }
  }
  
  /*
    Handles the dragging of a tab
  */
  async onTabDragStart(tab, evt) {

    if (! this.tabBar.contains(tab)) {
      return;
    }
        
    let hostWindow = this.parentElement;
    let position = lively.getClientPosition(hostWindow);
    let extent = lively.getExtent(hostWindow);
    
    this.dragWindow = await this.detachWindow(tab, position, extent);
    this.dragWindowPosition = position
   
    
    
    
    // this.dragWindow.onTitleMouseDown(evt);
  }
  
  
  onTabDrag(tab, evt) {
    lively.setClientPosition(this.dragWindow, this.dragWindowPosition.addPt(lively.getPosition(evt).subPt(this._dragOffset)))
  }
  
  
  onTabDragEnd(tab, evt) {

  }
  /*
    By pressing Esc, the last drag in or drag out shall get reverted.
  */
  revertLastAction() {
    if (this.lastActions.length === 0) return;
    
    let lastAction = this.lastActions.pop();
    
    if (lastAction.dragIn) {
      this.detachWindow(lastAction.tab, lastAction.formerPosition, lastAction.formerExtent, false);
    } else {
      this.addWindow(lastAction.tab, false);
    }
    
  }
  
  /*MD ## Tabs MD*/
  /*
    Unwrapps the content of the given window and
    adds it as a tab to itself
    
    win: window to be appended
    doUpdateActionHistory: Defines, whether a new entry for the action history shall be made.
  */
  addWindow(win, doUpdateActionHistory) {
    if(!win) {
      lively.notify("Unknown window");
      return;
    }        
    // Add window content
    var content = win.childNodes[0];
    let newTab = this.addContent(content, win.title);
    let formerPosition = lively.getClientPosition(win);
    let formerExtent = lively.getExtent(win);
    // Remove old, empty window    
    win.remove();
    
    if (doUpdateActionHistory === undefined || (doUpdateActionHistory && doUpdateActionHistory !== false)) {
      this.lastActions.push({ 
        dragIn: true,
        tab: newTab,
        formerPosition: formerPosition,
        formerExtent: formerExtent
      });
    }
      
  }
  
  /*
    Adds the content with the given title as a tab to itself
  */ 
  addContent(content, title){    
    this.appendChild(content);
    // Store title
    content.title = title;
    // Add tab
    var newTab = this.addTab(content);
    this.resizeContent(this);
    this.bringToForeground(newTab);    
        
    return newTab;
  }
  
  /*
    Adds a tab that references its content to the tabbar
  */
  addTab(content){
    // Set title and check for unsaved changes
    let tabTitle = <span id="tab-title">{content.title ? content.title : "unkown"}</span>;
    var newTab = (<li click={evt => { this.bringToForeground(newTab)}} class="clickable" draggable="true"> 
                    <a> 
                      { tabTitle }
                      <span class="clickable"
                        click={evt => { 
                          this.removeTab(newTab, true)
                          evt.stopPropagation()
                          evt.preventDefault()
                        }}>
                        <i class="fa fa-close"/>
                      </span>
                    </a>
                  </li>);
    newTab.tabContent = content;
    newTab.tabTitle = tabTitle;
    // Check for unsaved changes
    if(content.unsavedChanges && content.unsavedChanges()) {
      this.highlightUnsavedChanges(null, newTab);
    }
    
    // Register handler
    newTab.addEventListener("dragstart", evt => {
      evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 
      this._dragOffset = lively.getPosition(evt)
      this.dragWindow = null
    });
    newTab.addEventListener("drag", evt => {
      if (!this.dragWindow && lively.getPosition(evt).dist(this._dragOffset) > 20) {
        this.onTabDragStart(newTab, evt)
      }
      if (this.dragWindow) {
        this.onTabDrag(newTab, evt)
      }
      evt.stopPropagation()
    });
    newTab.addEventListener("dragend", evt => {
      if (this.dragWindow) {
        this.onTabDragEnd(newTab, evt)
      }
      evt.stopPropagation()
    });

    newTab.addEventListener("mousedown", evt => {
      this.registerPosition(evt, newTab);
      evt.stopPropagation();
    });
    
    newTab.tabContent.addEventListener("keyup", (evt) => {
      this.highlightUnsavedChanges(evt, newTab);
    });
    
    clearInterval();
    
    // Add to DOM
    this.tabBar.appendChild(newTab);
    return newTab;
  }
  
  /*
    Removes the given tab and its content.
  */
  async removeTab(tab, checkUnsavedChanges) {
    if (tab) {
      // Change focus if removed tab was focused
      if(this.isTabOnForeground(tab) && this.tabs.length > 1){
        this.bringToForeground(this.getFollowingTab(tab));
      }
      
      // Check for unsaved changes.
      if (checkUnsavedChanges && tab.tabContent && tab.tabContent.unsavedChanges && tab.tabContent.unsavedChanges()) {
        if (! await lively.confirm("Window contains unsaved changes, close anyway?") ) {
          return;
        }
      }
      
      // Remove tab.
      if (this.contains(tab.tabContent)) {        
        this.tabBar.removeChild(tab);
        this.removeChild(tab.tabContent);
      }
      
      // Remove window if empty
      if(this.tabs.length === 0) {
        this.parentElement.remove();
      }
      
      // Remove the last tab if necessary
      if (this.tabs.length === 1) {
        this.removeLastTab();
        this.parentElement.remove();
      }
    }
    
  }
  
  /*
    Puts the current tab to the background and
    puts the given one to the foreground
  */
  bringToForeground(tab) {
    if (!tab) {
      lively.notify("Unknown tab");
      return;
    }
    // Bring old tab to background
    var oldTab = this.getTabOnForeground();
    if(oldTab) {
      oldTab.classList.remove("tab-foreground");
      oldTab.tabContent.style.display = "none";
    }
    // Bring to foreground
    tab.classList.add("tab-foreground");
    tab.tabContent.style.display = "block";
    // This bugs if the tabContent is lively container that is not in edit mode!!
    tab.tabContent.focus();
    this.resizeContent(this);
  }
  
  /*
    Detaches the given tab from the wrapper as a
    standalone window
  */
  async detachWindow(tab, position, extent, doUpdateActionHistory) {
    this.removeTab(tab, false);
    
    // Remove properties, so content matches windows sizes again.
    tab.tabContent.style.removeProperty("height");
    tab.tabContent.style.removeProperty("width");
    
    // Create new window
    var win = await (<lively-window>{ tab.tabContent }</lively-window>);
    win.childNodes[0].style.removeProperty("display");
    win.title = tab.tabContent.title;
    
    // Set styles
    win.classList.remove("tabbed");
    win.classList.remove("activeTab");
    win.style.zIndex = window.getComputedStyle(win).getPropertyValue('z-index')+1;
    
    // Add to DOM
    document.body.appendChild(win);
    
    // Set position; position can be given or it will be put ontop of the parent
    if(!position)
      position = lively.getClientPosition(this.parentElement);
    lively.setClientPosition(win, position);
    // Set extent; extent can be given or it will be taken from parent
    if(!extent){
      extent = lively.getExtent(this.parentElement)
    }
    lively.setExtent(win, extent);
    
    if (doUpdateActionHistory === undefined || (doUpdateActionHistory && doUpdateActionHistory !== false)) {
      this.lastActions.push({
        dragIn: false,
        tab: win,
        formerPosition: null // only interesting for reverting dragging in
      })
    }
    
    return win;
  }
  
  async removeLastTab() {
    
    let position = lively.getClientPosition(this.parentElement);
    let extent = lively.getExtent(this.parentElement);
    // Get content of last tab.
    let content = this.children[0];
    
    // Remove properties, so content matches windows sizes again.
    content.style.removeProperty("height");
    content.style.removeProperty("width");
    
    // Create new window
    let win = await (<lively-window>{ content }</lively-window>);
    win.childNodes[0].style.removeProperty("display");
    win.title = content.title;
    
    // Set styles
    win.classList.remove("tabbed");
    win.classList.remove("activeTab");
    win.style.zIndex = window.getComputedStyle(win).getPropertyValue('z-index')+1;
    
    document.body.appendChild(win);
    
    lively.setClientPosition(win, position);
    lively.setExtent(win, extent);
    
  }
  
  /*
    Resizes all the content for every tab
  */
  resizeContent(self) {
    if(self.children) {
      for (let c of self.children){
        lively.setExtent(c, pt(this.offsetWidth, this.offsetHeight));
        c.dispatchEvent(new CustomEvent("extent-changed"))
      }
    }
  }
  
  /*
    Register current position.
  */
  registerPosition(evt, tab) {
    this.startPos = lively.getClientPosition(tab);
  }
  
  resetMemoziredPosition() {
    this.startPos = null;
  }
  
  /*
    Returns the tab that is currently on foreground
  */
  getTabOnForeground() {
    for(let ea of this.tabs) {
      if(this.isTabOnForeground(ea)){
        return ea;
      }
    }
  }
  
  /*
    Returns the index of the given tab
  */ 
  getTabIndex(tab){
    return this.tabs.indexOf(tab);
  }
  
  /*
    Determines if the given tab is on foreground
  */
  isTabOnForeground(tab) {
    return tab.tabContent.style.display === 'block' && this.tabs.includes(tab);
  }  

  /*
    Returns the tab that follows the given one in the tabbar.
    If the given tab is the last one, the first tab will be returned.
  */
  getFollowingTab(tab) {
    if(this.tabs.length > 1) {
      return this.tabs[(this.getTabIndex(tab) + 1) % this.tabs.length];
    }
  }
  
  highlightUnsavedChanges(evt, tab) {
    
    if (evt && evt.ctrlKey && evt.key === 's') {
      tab.tabTitle.classList.remove("unsaved-changes");
      if (tab.tabTitle.children[0]) {        
        tab.tabTitle.children[0].remove();
      }
    }
    
    if (tab.tabContent && tab.tabContent.unsavedChanges && tab.tabContent.unsavedChanges()) {      
      if (! tab.tabTitle.classList.contains("unsaved-changes")) {
        tab.tabTitle.classList.add("unsaved-changes");
        tab.tabTitle.appendChild(<span> *</span>); 
      }
    }
  } 
  
  updateTabTitle(title) {
    let tab = this.getTabOnForeground();
    tab.tabTitle.innerHTML = title;
  }
  /*MD ## Lively-specific API MD*/
  
  windowToggleVisibility(windowId) {
    var window = this.get("#" + windowId);
    
    if (window) {
      window.classList.toggle("tab-foreground");
      window.classList.toggle("tab-background");
    }
  }
  
  livelyMinimizedTitle() {
    return "Tabbed window (minimized)";
  }
  
}