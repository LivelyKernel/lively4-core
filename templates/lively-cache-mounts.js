import Morph from 'src/components/widgets/lively-morph.js';
import focalStorage from 'src/external/focalStorage.js';

export default class LivelyCacheMounts extends Morph {
  async initialize() {
    this.windowTitle = "Lively Cache Mounts";
    this.selectedMount = null;
    this.lastSelection = null;
    
    this._checkMounts();
  }
  
  loadMounts(mounts) {
    this._mounts = mounts;
    this._filterMounts();
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
        this.selectedMount = mount;
        li.style.backgroundColor = "#eee";
      });
      ul.appendChild(li);
    }
    
    mountList.appendChild(ul);
  }
  
  _checkMounts() {
    focalStorage.getItem("lively4mounts").then(
      (mounts) => {
        if (mounts === null) {
          // Warn about missing mounts
          let ul = document.createElement("ul");
          let li = document.createElement("li");
          li.style.backgroundColor = "#f00";
          li.innerText = "Nothing mounted yet!";
          ul.appendChild(li);
        } else {
          this.loadMounts(mounts);
        }
      }
    )
  }
  
  _filterMounts() {
    const filteredMounts = ["sys", "html5"];
    let tmpMounts = [];
    
    for (let mount of this._mounts) {
      if (filteredMounts.includes(mount.name)) continue;
      
      tmpMounts.push(mount);
    }
    
    this._mounts = tmpMounts;
  }
}