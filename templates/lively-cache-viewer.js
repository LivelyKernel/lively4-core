import Morph from 'src/components/widgets/lively-morph.js';
import { Dictionary } from 'src/external/lively4-serviceworker/src/dictionary.js';

export default class LivelyCacheViewer extends Morph {
  async initialize() {
    this.windowTitle = "LivelyCacheViewer";
    
    // Register listener to receive data from serviceworker
    window.serviceWorkerMessageHandlers['cacheViewer'] = (event) => {
      const message = event.data;
      
      // Only handle notifications here
      if (message.type === 'dataResponse') {
        this._receiveFromServiceWorker(message.command, message.data);
      }
    };
    
    this._requestFromServiceWorker('test', null);
    
    lively.html.registerButtons(this);
    //this._loadCachedFiles();
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
  
  /**
   * Send a request for data to the serviceworker
   */
  _requestFromServiceWorker(command, data) {
    navigator.serviceWorker.controller.postMessage({
      type: 'dataRequest',
      command: command,
      data: data
    });
  }
  
  /**
   * Receive some data from the serviceworker
   */
  _receiveFromServiceWorker(command, data) {
    console.log(command);
    console.log(data);
  }
}