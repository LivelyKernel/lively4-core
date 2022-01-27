"disable deepeval"

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyTabsWrapper extends Morph {
  
  /*MD ## Getter / Setter MD*/
  get tabBarId(){
    return "#tab-bar-identifier";
  }
  
  /*MD ## Setup MD*/
  
  initialize() {
        
    this.windowTitle = "LivelyTabsWrapper";
    
    this.content = "";
    
    this.bindEvents();
    
    
    // Add tabs to tab list for every window (stored in DOM)
    for(let ea of this.childNodes) {
      this.addTab(ea.title ? ea.title : "Unknown");
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
  onKeyDown(event) {
    // change tab
    if (event.ctrlKey && event.key === 'q') {
      var tabs = this.get(this.tabBarId).children;
      // Allways skip index 0 as this is the plus button
      const nextIdx = 1 + (this.getTabOnForeground(true) % (tabs.length -1));
      this.bringToForeground(tabs[nextIdx]);
      var content = this.children[nextIdx - 1]
      if (content) content.focus()
    }
  }
  
  
  /*MD ## Tabs MD*/
  
  async addWindow(win) {
    if(!win){
      lively.notify("Unknown window");
      return;
    }
    
    
    //win.classList.add("tabbed")
    //win.style.setProperty("display", "block");
    //win.style.setProperty("width", "100%");
    //win.style.setProperty("height", "100%");
    // inject window into this wrapper
    
    // Add window content
    this.addContent(win.childNodes[0], win.titleSpan.innerHTML)
    win.remove();
  }
  
  addContent(content, title){
    this.appendChild(content);
    content.title = title;
    // add tab
    var newTab = this.addTab(title);
    this.resizeContent(this);
    this.bringToForeground(newTab);
  }
  
  addTab(title){
    var newTab = (<li click={evt => { this.bringToForeground(newTab)}} class="clickable"  draggable="true"> 
                    <a>{title}
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
    newTab.addEventListener("dragstart", evt => this.onTabDragStart(newTab, evt))

    
    var tabBar = this.get(this.tabBarId);   
    tabBar.appendChild(newTab);
    return newTab;
  }
  
  removeTab(tab) {
    var tabList = this.get(this.tabBarId);
    var tabs = tabList.children;
    // start at 1 to skip the plus btn
    for(var i=1; i<tabs.length; i++){
      if(tabs[i] === tab) {
        var content = this.children[i-1];
        tabList.removeChild(tabs[i]);
        this.removeChild(content);
        // no tabs left -> remove window
        if(tabs.length <= 1){
          this.parentElement.remove();
        }
        // window had focus? -> put focus on first tab
        else{
          // This has no effect for what ever reason
          this.bringToForeground(tabs[1]);
        }
        return;
      }
    }
  }
  
  bringToForeground(tab) {
    if (!tab) {
      lively.notify("Unknown tab");
      return;
    }
    var tabs = this.get(this.tabBarId).children;
    for(var i=1; i < tabs.length; i++){
      var content = this.childNodes[i-1];
      // bring to foreground
      if(tabs[i] == tab) {
        tab.classList.add("tab-foreground");
        content.style.display = "block";
        content.classList.add("active-tab");
      }
      // bring to background
      else{
        tabs[i].classList.remove("tab-foreground");
        content.style.display = "none";
        content.classList.remove("active-tab");
      }
    }
  }
  
  async detachWindow(tab) {
    var tabList = this.get(this.tabBarId);
    var tabs = tabList.children;
    
    // #TODO sehr unschöner code, weil zwei listen....  indirekt mit indizes verbunden ist immer komisch..
    // ziel:  for(let ea of tabs) {   tabs.content ... }
    for(var i=1; i < tabs.length; i++){
      if(tabs[i] == tab) {
        this.bringToForeground(tab);
        var content = this.children[i-1];
        var win = await (<lively-window>{content}</lively-window>);
        win.title = content.title;
        lively.notify("content title " + content.title)
        // Move window out of wrapper
        win.classList.remove("tabbed");
        win.classList.remove("activeTab");
        win.style.removeProperty("width");
        win.style.zIndex = window.getComputedStyle(win).getPropertyValue('z-index')+1;
        document.body.appendChild(win);
        // Set position
        lively.setGlobalPosition(win, lively.getGlobalPosition(this.parentElement));
        lively.setPosition(win, lively.getPosition(this.parentElement));
        lively.setExtent(win, lively.getExtent(this.parentElement));
        // remove tab
        tabList.removeChild(tab);
        // remove window if there is no tab left
        if(tabs.length === 1) {
          this.parentElement.remove();
        }
        return win
      }
    }
  }
  
  resizeContent(self) {
    if(self.children) {
      for (let w of self.children){
        lively.setHeight(w, (this.offsetHeight - this.get(this.tabBarId).offsetHeight));
        lively.setWidth(w, this.offsetWidth);
      }
    }
  }
  
  getTabOnForeground(asIndex) {
    var tabs = this.get(this.tabBarId).children;
    for(var i=1; i < tabs.length; i++){
      if(tabs[i].classList.contains("tab-foreground")) {
        if(asIndex)
          return i;
        return tabs[i];
      }
    }
  }

  async onTabDragStart(tab, evt) {
    var win = await this.detachWindow(tab)
    win.onTitleMouseDown(evt)  
  }
  

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value)
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  

/*
  livelyInspect(contentNode, inspector) {
    // overrides how the inspector displays this component
  }
*/
  
  async livelyExample() {
    // For content in the window:
    //this.appendChild(<div>This is example content</div>);
    
  }
  
  livelyMigrate(other)  {
    
  
  }
  
  windowToggleVisibility(windowId) {
    var window = this.get("#" + windowId);
    
    if (window) {
      window.classList.toggle("tab-foreground");
      window.classList.toggle("tab-background");
    }
  }

  
}