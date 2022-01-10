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
    win.id = "window-" + id;
        
    //var content = document.createElement("lively-container");
    //components.openIn(window, content);
    win.style.setProperty("display", "block");
    //window.get(".window-titlebar").style.setProperty("display", "none");
    
    // inject window into this wrapper
    this.appendChild(win);
    lively.setPosition(win, lively.pt(0,0))
    
    // add tab
   var newTab = (<li click={async evt => { await this.switchToContentOfWindow(win)}} id={"tab-" + id} class="tab"> 
                    <a>{win.title}
                      <span class="window-button windows-close"
                        click={async evt => { await this.removeTab(id)}}>
                        <i class="fa fa-close"/>
                      </span>
                    </a>
                  </li>);
    newTab.targetWindow = win
    var tabBar = this.get("#tab-bar-identifier");   
    tabBar.appendChild(newTab);
    
    
    // lively.notify("Added tab " + id);
    
    // TODO: bring the new tab to foreground
  }
  
  async removeTab(id) {
    this.get("#tab-" + id).remove();
    this.get("#window-" + id).remove();
    // TODO: put focus on another tab it closed tab was in foreground
  }
  
  async switchToContentOfWindow(win) {
    if (!win) {
      lively.notify("Could not read content of Window " + win.title);
      return         
    }
    
    lively.notify("Switching to " + win.title);

    for (let ea of this.containedWindows) {        
      if (ea == win) {
        lively.notify("yeah!!!")
        this.windowToForeground(win);  
      } else {
        this.windowToBackground(ea);
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
  }
  
  windowToBackground(win) {
    win.style.display = "none"
  }
  
  windowToggleVisibility(windowId) {
    var window = this.get("#" + windowId);
    
    if (window) {
      window.classList.toggle("tab-foreground");
      window.classList.toggle("tab-background");
    }
  }

  
}