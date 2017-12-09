import Morph from 'src/components/widgets/lively-morph.js';
import { Dictionary } from 'src/external/lively4-serviceworker/src/dictionary.js';

export default class LivelyCacheViewer extends Morph {
  async initialize() {
    this.windowTitle = "LivelyCacheViewer";
    
    lively.html.registerButtons(this);
    this._loadCachedFiles();
  }
  
  async _loadCachedFiles() {
    let db = new Dictionary("response-cache");
    let entries = await db.toArray();
    let files = [];
    var fileList = this.get("#files");
    
    for (let entry of entries) {
      let value = entry[0].split(" ").pop();
      let option = document.createElement('option');
      
      option.value = value;
      option.innerHTML = value;
      fileList.appendChild(option);
    }
  }
  
  getFile(name) {
    return new Promise((resolve, reject) => {
      var instanceName = lively4url.split("/").pop();
      var openRequest = indexedDB.open("lively-sw-cache-" + instanceName);
    
      openRequest.onsuccess = function(e) {
        var db = e.target.result;
        var transaction = db.transaction(["response-cache"], "readonly");
        var objectStore = transaction.objectStore("response-cache");
        var objectStoreRequest = objectStore.get("GET " + name);

        objectStoreRequest.onsuccess = (event) => {
          if (!objectStoreRequest.result) return;

          resolve(objectStoreRequest.result);
        };
        
        objectStoreRequest.onerror = (event) => {
          resolve(null);
        };
      };
      
      openRequest.onerror = (event) => {
        resolve(null);
      };
    });
  }
  
  async onLoadFile() {
    var input = this.get("#filename");
    var file = await this.getFile(input.value);
    var input = this.get("#content");
    var date = this.get("#date");
    const reader = new FileReader();

    reader.addEventListener('loadend', (e) => {
      const text = e.srcElement.result;
      input.innerText = text;
    });

    reader.readAsText(file.value.body);
    date.innerText = "Cached at: " +  new Date(file.timestamp);
  }
}