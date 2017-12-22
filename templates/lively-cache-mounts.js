import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyCacheMounts extends Morph {
  async initialize() {
    this.windowTitle = "Lively Cache Mounts";
    this.selectedMount = null;
    this.lastSelection = null;
  }
  
  loadMounts(mounts) {   
    let mountList = this.get("#mountList");
    mountList.innerHTML = "";
    
    let ul = document.createElement("ul");
    for (let mount of mounts) {
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
}