"disable deepeval"

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyTabsWrapper extends Morph {
  initialize() {
    
    this.windowTitle = "LivelyTabsWrapper";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods

    // register click listener for plus button
    var plusBtn = this.get("#plus-btn");
    //plusBtn.addEventListener('click', (evt) => lively.notify("clicked"));
    lively.addEventListener("span", plusBtn, "click", async evt => await this.addWindow());
    
    this.content = "";
    
    // #TODO add only new tabs for each window
    var oldWindows = Array.from(this.childNodes)
    this.innerHTML = ""
    for(let ea of oldWindows) {
      this.addWindow(ea)
    }    
    
  }
  
  get containedWindows() {
    return this.childNodes.filter(ea => ea.localName == "lively-window")
  }

  
  async addWindow(win) {
    
    var id = Date.now();
    var title;
    
    if (win) {
      title = win.titleSpan.innerHTML;
    } else {
      lively.notify("create new window")
      win = await lively.create("lively-window");
    }
    win.classList.add("tabbed")
    
    win.title = (title) ? title : id;
    win.tabButtonId = "tab-" + id;        
    win.style.setProperty("display", "block");
    win.style.setProperty("width", "100%");
    
    // inject window into this wrapper
    this.appendChild(win);
    lively.setPosition(win, lively.pt(0,0))
    
    // add tab
   var newTab = (<li click={async evt => { await this.switchToContentOfWindow(win)}} id={"tab-" + id} class="tab"> 
                    <a>{win.title}
                      <span id="detach-button" class="tab-detach-button"
                        click={async evt => { 
                          this.detachWindow(win.tabButtonId);                          
                        }}>
                        <i class="fa fa-angle-double-up"></i>
                      </span>
                      <span class="window-button windows-close"
                        click={async evt => { await this.removeTab(id)}}>
                        <i class="fa fa-close"/>
                      </span>
                    </a>
                  </li>);
    newTab.targetWindow = win
    var tabBar = this.get("#tab-bar-identifier");   
    tabBar.appendChild(newTab);
        
    // TODO: bring the new tab to foreground
    
    this.switchToContentOfWindow(win);
  }
  
  async removeTab(id) {
    this.get("#tab-" + id).remove();
    this.get("#window-" + id).remove();
    // TODO: put focus on another tab
  }
  
  async switchToContentOfWindow(win) {
    if (!win) {
      lively.notify("Could not read content of Window " + win.title);
      return         
    }
    
    for (let ea of this.containedWindows) {        
      if (ea == win) {
        this.windowToForeground(win);
      } else {
        this.windowToBackground(ea);
      }
    }
    
    
  }
  
  async detachWindow(tabButtonId) {
    
    for (let win of this.children) {      
      if (win.nodeName === "LIVELY-WINDOW") {        
        if (win.tabButtonId === tabButtonId) {
          
          this.switchToContentOfWindow(win);

          win.classList.remove("tabbed");
          win.classList.remove("activeTab");
          document.body.appendChild(win);
  
          // Gets the Tab Indicator in the tab bar.
          var tabButton = this.get("#" + tabButtonId);
          lively.notify(tabButtonId);
          lively.notify(tabButton);
          if (tabButton) {
            tabButton.remove();
            lively.notify("Removed!");
          }
          
        }
      }
    }
    
  }
  
  onDblClick() {
    this.animate([
      {backgroundColor: "lightgray"},
      {backgroundColor: "red"},
      {backgroundColor: "lightgray"},
    ], {
      duration: 1000
    })
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
  
  windowToForeground(win) {
    if (!win) return;
    win.style.display = "block"
    win.classList.add("active-tab");
  }
  
  windowToBackground(win) {
    win.style.display = "none";
    win.classList.remove("active-tab")
  }
  
  windowToggleVisibility(windowId) {
    var window = this.get("#" + windowId);
    
    if (window) {
      window.classList.toggle("tab-foreground");
      window.classList.toggle("tab-background");
    }
  }

  
}