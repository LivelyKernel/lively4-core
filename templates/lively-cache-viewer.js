import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyCacheViewer extends Morph {
  async initialize() {
    this.windowTitle = "LivelyCacheViewer";
    
    lively.html.registerButtons(this);
  }
  
  getFile(name) {
    return new Promise((resolve, reject) => {
      var openRequest = indexedDB.open("lively-sw-cache");
    
      openRequest.onsuccess = function(e) {
        var db = e.target.result;
        var transaction = db.transaction(["dictionary"], "readonly");
        var objectStore = transaction.objectStore("dictionary");
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