import Morph from 'src/components/widgets/lively-morph.js';
import focalStorage from 'src/external/focalStorage.js';

export default class LivelyCacheMounts extends Morph {
  async initialize() {
    this.windowTitle = "Lively Cache Mounts";
    this.registerButtons();
    
    // Register listener to receive data from serviceworker
    window.serviceWorkerMessageHandlers['cacheViewer'] = (event) => {
      const message = event.data;
      
      // Only handle notifications here
      if (message.type === 'dataResponse') {
        this._receiveFromServiceWorker(message.command, message.data);
      }
    };
    
    this.selectedMount = null;
    this.lastSelection = null;
    
    this._checkMounts();
  }
  
  /**
   *
   */
  loadMounts(mounts) {
    this._filterMounts(mounts);
    let mountList = this.get("#mountList");
    mountList.innerHTML = "";
    
    let ul = document.createElement("ul");
    for (let mount of this._mounts) {
      let li = document.createElement("li");
      li.innerText = mount.name;
      li.addEventListener("click", () => {
        if (this.lastSelection != null) {
          this.lastSelection.style.backgroundColor = "#fff";
        }
        
        this.lastSelection = li;
        this._selectMount(mount);
        li.style.backgroundColor = "#eee";
        
        this._showDirectory(this.selectedMount.path);
      });
      ul.appendChild(li);
      }

    mountList.appendChild(ul);
  }
  
  /**
   * Selects a mount and updates UI
   */
  _selectMount(mount) {
    this.selectedMount = mount;
    this.get("#cacheMountButton").disabled = (this.selectedMount == null);
  }
  
  /**
   * Looks up mounted file storages
   */
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
  
  /**
   * Methods to update UI
   */
  _showLoadingScreen(visible) {
    let overlay = this.get('#overlay');
    if (visible) {
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }
  }
  
  /**
   * Filters mounts have nothing to cache
   */
  _filterMounts(mounts) {
    const filteredMounts = ["sys", "html5"];
    this._mounts = [];
    
    for (let mount of mounts) {
      if (filteredMounts.includes(mount.name)) continue;
      
      this._mounts.push(mount);
    }
  }
  
  /**
   * Displays the chosen directory
   */
  async _showDirectory(path, parentPath) {
    let response = await fetch(`https://lively4${path}/`, { method: "OPTIONS" });
    let dir = await response.json();
    let dirTree = this.get("#dirTree");
    dirTree.innerHTML = "";
    let ul = document.createElement("ul");
    
    // Add parent
    if(path != this.selectedMount.path) {
      let parentPath = path.split('/');
      parentPath.pop();
      parentPath = parentPath.join('/');
      
      let li = document.createElement("li");
      li.innerText = "(D) ..";
      li.addEventListener("dblclick", async () => {
        await this._showDirectory(parentPath);
      });
      ul.appendChild(li);
    }
    
    for (let dirObject of dir.contents) {
      let li = document.createElement("li");
      // Temporary solution the lively4 dropbox API does not provide directory as attribute value yet
      const isDirectory = dirObject.type == "directory";
      li.innerText = isDirectory ? "(D) " : "(F) ";
      li.innerText += dirObject.name;
      
      li.addEventListener("click", () => {
        if (this._lastSelectedObject != null) {
          this._lastSelectedObject.style.backgroundColor = "#fff";
        }
        
        this._lastSelectedObject = li;
        li.style.backgroundColor = "#eee";
        this._selectMountObject(dirObject);
      });
      
      if(isDirectory) {
        li.addEventListener("dblclick", async () => {
          this._selectMountObject(dirObject);
          await this._showDirectory(path + '/' + dirObject.name);
        })
      }
      
      ul.appendChild(li);
    }
    
    let breadcrumbs = this.get("#breadcrumbs");
    breadcrumbs.innerHTML = `(${path})`;
    
    dirTree.appendChild(ul);
  }
  
  /**
   *
   */
  _selectMountObject(mountObject) {
    if (this._objectPath == null) {
      this._objectPath = `https://lively4${this.selectedMount.path}`;
    }
    
    this._selectedMountObject = mountObject;
    this.get("#cacheObjectButton").disabled = (this.selectedMount == null);
  }
  
  /**
   *
   */
  _cacheMountObject(mountObject) {
    let url = `${this._objectPath}/${mountObject.name}`;
    
    if (mountObject.type === "directory") {
      this._showLoadingScreen(true);
      navigator.serviceWorker.controller.postMessage({
        type: 'dataRequest',
        command: "preloadFull",
        data: `https://lively4${url}/`
      });
    } else if (mountObject.type === "file") {
      this._showLoadingScreen(true);
      fetch(url, { method: "GET" }).then(() => {
        this._showLoadingScreen(false);
      });
      fetch(url, { method: "OPTIONS" });
    }
  }
  
  /**
   * Receive some data from the serviceworker
   */
  _receiveFromServiceWorker(command, data) {
    switch (command) {
      case 'fullLoadingDone':
        this._showLoadingScreen(false);
        break;
      default:
        console.warn(`Unknown data received from serviceWorker: ${command}: ${data}`)
    }
  }
  
  async onCacheObjectButton() {
    this._cacheMountObject(this._selectedMountObject);
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