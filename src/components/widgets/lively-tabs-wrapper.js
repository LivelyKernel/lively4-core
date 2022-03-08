"disable deepeval"

import Morph from 'src/components/widgets/lively-morph.js';
import {pt} from 'src/client/graphics.js'

export default class LivelyTabsWrapper extends Morph {
  
  /*MD ## Getter / Setter MD*/
  
  get tabBar() {
    return this.parentElement.get("#tab-bar-identifier");
  } 
  get tabs() {
    // Without + button 
    return Array.from(this.tabBar.children);
    // With + button
    //return Array.from(this.tabBar.children).slice(1);
  }
  
  get numberOfWindows() {
    return this.childElementCount;
  }
  /*MD ## Setup MD*/
  
  initialize() {
    
    /* 
      Defines the minimal distance a tab needs to get dragged
      to get detached.
    */
    this.dragThreshold = 200; 
        
    // The tabs windows shall explicitly not contain any title.
    this.windowTitle = "";
    
    this.content = "";
    
    this.bindEvents();
    
    this.lastActions = [];
    /*
    { 
      dragIn: true, // true for a drag in action or false for a drag out action
      tab: null, // The tab the action is about.
      formerPosition: null // Only important to put windows back at their former position.
    } 
    */
     
    
    // Add tabs to tab list for every window (stored in DOM).
    // Each tab will be "re-created". Its previous version needs to be deleted.
     
    if (this.children.length > 0) {
      while(this.tabBar.firstChild) {
        this.tabBar.removeChild(this.tabBar.firstChild);
      }
      
      for(let ea of this.children) {
        this.addTab(ea); 
      }
    }
      
  }
  
  bindEvents(){
    this.registerButtons();
    
    lively.html.registerKeys(this); // automatically installs handler for some methods

    // Register event handlers
    
    /* 
      This event is an artifact, that was used to create windows, when dragging-in windows was
      not yet implemented. Later on, it was not used anymore, but might be useful for future featuers.
    */
    //lively.addEventListener("tabs-wrappper", this.get("#plus-btn"), "click", async evt => await this.addWindow()); 
    
    lively.removeEventListener("tabs-wrappper", this.parentElement, "keydown");
    lively.addEventListener("tabs-wrappper", this.parentElement, "keydown", evt => this.onKeyDown(event));
    
    // Register observer
    new ResizeObserver(() => this.resizeContent(this)).observe(this);
  }
  
  /*MD ## Events MD*/
  
  /*
    Implements keyboard shortcuts
  */
  onKeyDown(event) {
    // change tab on ctrl + q
    if (event.ctrlKey && event.key === 'q') {
      var nextTab = this.getFollowingTab(this.getTabOnForeground());
      this.bringToForeground(nextTab);
    }
    
    if (event.key ===  "Escape") {
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
    evt.stopPropagation();
    evt.preventDefault();
    
    let hostWindow = this.parentElement;
    var dragStart = lively.getPosition(hostWindow);
    
    this.dragWindow = await this.detachWindow(tab);
    lively.setExtent(this.dragWindow, pt(600,400));
    this.dragWindow.onTitleMouseDown(evt);
    lively.setGlobalPosition(this.dragWindow , lively.getPosition(hostWindow));
    this.dragOffset = dragStart.subPt(this.dragWindow);
      
  }
  
  async onTabDrag(tab, evt) {
    lively.showEvent(evt)
    lively.setGlobalPosition(this.dragWindow , lively.getPosition(evt).addPt(this.dragOffset))
  }
  
  async onTabDragEnd(tab, evt) {
    // do nothing
  }
  
  /*
    By pressing Esc, the last drag in or drag out shall get reverted.
  */
  revertLastAction() {
    if (this.lastActions.length === 0) return;
    
    let lastAction = this.lastActions.pop();
    
    if (lastAction.dragIn) {
      this.detachWindow(lastAction.tab, lastAction.formerPosition, false);
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
    if(!win){
      lively.notify("Unknown window");
      return;
    }        
    // Add window content
    var content = win.childNodes[0];
    let newTab = this.addContent(content, win.title);
    let formerPosition = lively.getGlobalPosition(win);
    // Remove old, empty window    
    win.remove();
    
    if (doUpdateActionHistory === undefined || (doUpdateActionHistory && doUpdateActionHistory !== false)) {
      this.lastActions.push({ 
        dragIn: true,
        tab: newTab,
        formerPosition: formerPosition
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
    
    var newTab = (<li click={evt => { this.bringToForeground(newTab)}} class="clickable" draggable="true"> 
                    <a> 
                      <span id="tab-title">{content.title ? content.title : "unknown"}</span>
                      <span class="clickable"
                        click={evt => { 
                          this.removeTab(newTab)
                          evt.stopPropagation()
                          evt.preventDefault()
                        }}>
                        <i class="fa fa-close"/>
                      </span>
                    </a>
                  </li>);
    newTab.tabContent = content;
    newTab.addEventListener("dragstart", evt => {
      this.onTabDragStart(newTab, evt)
      evt.stopPropagation()
    });
    newTab.addEventListener("drag", evt => {
      this.onTabDrag(newTab, evt)
      evt.stopPropagation()
    });
    newTab.addEventListener("dragend", evt => {
      this.onTabDragEnd(newTab, evt)
      evt.stopPropagation()
    });

    newTab.addEventListener("mousedown", evt => {
      this.registerPosition(evt, newTab);
      evt.stopPropagation()
    });
    
    // Add to DOM
    this.tabBar.appendChild(newTab);
    return newTab;
  }
  
  /*
    Removes the given tab and its content
  */
  removeTab(tab) {
    if (tab) {
      
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
      
      // Change focus if removed tab was focused
      if(this.isTabOnForeground(tab) && this.tabs.length > 1){
        this.bringToForeground(this.getFollowingTab(tab));
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
  async detachWindow(tab, position, doUpdateActionHistory) {
    
    this.removeTab(tab);
    
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
    if (position) {
      lively.setGlobalPosition(win, position);
    } else {
      lively.setGlobalPosition(win, lively.getGlobalPosition(this.parentElement));
    }
    lively.setExtent(win, lively.getExtent(this.parentElement));
    
    if (doUpdateActionHistory === undefined || (doUpdateActionHistory && doUpdateActionHistory !== false)) {
      this.lastActions.push({
        dragIn: false,
        tab: win,
        formerPosition: null // only interesting for reverting dragging in
      })
    }
    
    this.bringToForeground(this.tabs[0]);
    
    lively.notify("Remaining Windows: " + this.numberOfWindows);
    
    /*
    if (this.numberOfWindows <= 1) {
      await this.removeLastTab();
      this.parentElement.remove();
    }
    */
    
    return win;
  }
  
  async removeLastTab() {
    
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
    
    lively.setGlobalPosition(win, lively.getGlobalPosition(this.parentElement));
    lively.setExtent(win, pt(600, 400));
    
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
    this.startPos = lively.getGlobalPosition(tab);
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
    return tab.classList.contains("tab-foreground")
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