"disable deepeval"

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyTabsWrapper extends Morph {
  
  /*MD ## Getter / Setter MD*/
  get tabBar() {
    return this.get("#tab-bar-identifier");
  }
  get tabs() {
    return Array.from(this.tabBar.children).slice(1);
  }
  
  /*MD ## Setup MD*/
  
  initialize() {
        
    this.windowTitle = "LivelyTabsWrapper";
    
    this.content = "";
    
    this.bindEvents();
    
    
    // Add tabs to tab list for every window (stored in DOM)
    for(let ea of this.childNodes) {
      this.addTab(ea);
    }
  }
    
  bindEvents(){
    this.registerButtons();
    
    lively.html.registerKeys(this); // automatically installs handler for some methods

    // register event handler
    lively.addEventListener("tabs-wrappper", this.get("#plus-btn"), "click", async evt => await this.addWindow());
    
    lively.removeEventListener("tabs-wrappper", this.parentElement, "keydown");
    lively.addEventListener("tabs-wrappper", this.parentElement, "keydown", evt => this.onKeyDown(event));
    // register observer
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
  }
  
  /*
    Handles the dragging of a tab
  */
  async onTabDragStart(tab, evt) {
    var win = await this.detachWindow(tab)
    win.onTitleMouseDown(evt)  
  }
  
  indicateUnsavedChanges(evt, content, tab) {
    
    lively.notify("Adding *")
    
    if (content && content.unsavedChanges && content.unsavedChanges()) {
      tab.childNodes[0].innerHtml += "*";
    } else {
      let newTabText =  tab.childNodes[0].innerHtml;
      if (newTabText.slice(-1) === "*") {
         tab.childNodes[0].innerHtml =  tab.childNodes[0].innerHtml.slice(0, -1);
      }
    }
    
  }
  
  
  /*MD ## Tabs MD*/
  /*
    Unwrapps the content of the given window and
    adds it as a tab to itself
  */
  addWindow(win) {
    if(!win){
      lively.notify("Unknown window");
      return;
    }        
    // Add window content
    var content = win.childNodes[0];
    this.addContent(content, win.title);
    // remove old, empty window    
    win.remove();
  }
  
  /*
    Adds the content with the given title as a tab to itself
  */
  addContent(content, title){
    this.appendChild(content);
    // store title
    content.title = title;
    // add tab
    var newTab = this.addTab(content);
    this.resizeContent(this);
    this.bringToForeground(newTab);
  }
  
  
  /*
    Adds a tab that references its content to the tabbar
  */
  addTab(content){
    var newTab = (<li click={evt => { this.bringToForeground(newTab)}} class="clickable"  draggable="true"> 
                    <a>{content.title ? content.title : "unknown"}
                      <span id="detach-button" class="clickable"
                        click={evt => { 
                            this.detachWindow(newTab); 
                            evt.stopPropagation()
                            evt.preventDefault()
                        }}>
                        <i class="fa fa-angle-double-up"></i>
                      </span>
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
    newTab.addEventListener("dragstart", evt => this.onTabDragStart(newTab, evt));
    newTab.addEventListener("keydown", evt => this.indicateUnsavedChanges(evt, content, newTab));
    
    // add to DOM
    this.tabBar.appendChild(newTab);
    return newTab;
  }
  
  /*
    Removes the given tab and its content
  */
  removeTab(tab) {
    this.tabBar.removeChild(tab);
    this.removeChild(tab.tabContent);
    // remove window if empty
    if(this.tabs.length === 0) {
      this.parentElement.remove();
    }
    // change focus if removed tab was focused
    if(this.isTabOnForeground(tab) && this.tabs.length > 1){
      this.bringToForeground(this.getFollowingTab(tab));
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
    // bring old tab to background
    var oldTab = this.getTabOnForeground();
    if(oldTab) {
      oldTab.classList.remove("tab-foreground");
      oldTab.tabContent.style.display = "none";
    }
    // bring to foreground
    tab.classList.add("tab-foreground");
    tab.tabContent.style.display = "block";
    // this bugs if the tabContent is lively container that is not in edit mode!!
    tab.tabContent.focus();
  }
  
  /*
    Detaches the given tab from the wrapper as a
    standalone window
  */
  async detachWindow(tab) {
    this.removeTab(tab);
    // create new window
    var win = await (<lively-window>{tab.tabContent}</lively-window>);
    win.title = tab.tabContent.title;
    // set styles
    win.classList.remove("tabbed");
    win.classList.remove("activeTab");
    win.style.removeProperty("width");
    win.style.zIndex = window.getComputedStyle(win).getPropertyValue('z-index')+1;
    // add to DOM
    document.body.appendChild(win);
    // Set position
    lively.setGlobalPosition(win, lively.getGlobalPosition(this.parentElement));
    lively.setExtent(win, lively.getExtent(this.parentElement));
    return win;
  }
  
  /*
    Resizes all the content for every tab
  */
  resizeContent(self) {
    if(self.children) {
      for (let c of self.children){
        lively.setHeight(c, (this.offsetHeight - this.tabBar.offsetHeight));
        lively.setWidth(c, this.offsetWidth);
      }
    }
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
    
  async livelyExample() {
    // For content in the window:
    //this.appendChild(<div>This is example content</div>);
  }
  
  windowToggleVisibility(windowId) {
    var window = this.get("#" + windowId);
    
    if (window) {
      window.classList.toggle("tab-foreground");
      window.classList.toggle("tab-background");
    }
  }

  
}