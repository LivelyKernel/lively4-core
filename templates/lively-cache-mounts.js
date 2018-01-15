import Morph from 'src/components/widgets/lively-morph.js';
import focalStorage from 'src/external/focalStorage.js';

export default class LivelyCacheMounts extends Morph {
  async initialize() {
    this.windowTitle = "Lively Cache Mounts";
    this.registerButtons();
    
    this.selectedMount = null;
    this.lastSelection = null;
    
    this._checkMounts();
  }
  
  loadMounts(mounts) {
    this._filterMounts(mounts);
    let mountList = this.get("#mountList");
    mountList.innerHTML = "";
    
    let ul = document.createElement("ul");
    for (let mount of this._mounts) {
      let li = document.createElement("li");
      li.innerText = mount.name;
      li.addEventListener("click", () => {
        if (this.lastSelection !== null) {
          this.lastSelection.style.backgroundColor = "#fff";
        }
        
        this.lastSelection = li;
        this._selectMount(mount);
        li.style.backgroundColor = "#eee";
      });
      ul.appendChild(li);
      }
    
    mountList.appendChild(ul);
  }
  
  _selectMount(mount) {
    this.selectedMount = mount;
    this.get("#cacheMountButton").disabled = (this.selectedMount == null);
  }
  
  _checkMounts() {
    focalStorage.getItem("lively4mounts").then(
      (mounts) => {
        if (mounts === null) {
          // Warn about missing mounts
          let mountList = this.get("#mountList");
          mountList.innerHTML = "";
          let ul = document.createElement("ul");
          let li = document.createElement("li");
          li.style.backgroundColor = "#f00";
          li.innerText = "Nothing mounted yet!";
          ul.appendChild(li);
          mountList.appendChild(ul);
        } else {
          this.loadMounts(mounts);
        }
      }
    )
  }
  
  _filterMounts(mounts) {
    const filteredMounts = ["sys", "html5"];
    this._mounts = [];
    
    for (let mount of mounts) {
      if (filteredMounts.includes(mount.name)) continue;
      
      this._mounts.push(mount);
    }
  }
  
  async onCacheMountButton() {
    let cachedMounts = await focalStorage.getItem("lively4cachedmounts");
    if(cachedMounts == null) {
      cachedMounts = [];
    }
    
    // Check if this mount is already cached
    if(cachedMounts.indexOf(this.selectedMount.path) == -1) {
      cachedMounts.push(this.selectedMount.path);
      await focalStorage.setItem("lively4cachedmounts", cachedMounts);
    }
    
    let path = this.selectedMount.path;
    
    navigator.serviceWorker.controller.postMessage({
      type: 'dataRequest',
      command: "preloadFull",
      data: `https://lively4${path}/`
    });
  }
}