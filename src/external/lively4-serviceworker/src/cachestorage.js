/**
 * 
 */
export class CacheStorage {
  constructor() {
    var request = indexedDB.open("lively-sw-cache", 1);
    
    request.onupgradeneeded = (event) => {
      this.db = event.target.result;
      this.db.createObjectStore("files");
    };
    
    request.onsuccess = (event) => {
      this.db = event.target.result;
    }
  }
  
  put(key, value) {
    this._getObjectStore().put(value, key);
  }
  
  match(key) {
    var promise = new Promise((resolve, reject) => {
      var request = this._getObjectStore().get(key);
      request.onsuccess = (event) => {
        if(request.result) {
          resolve(new Response(
            request.result.body,
            {
              status: request.result.status,
              statusText: request.result.statusText,
              headers: new Headers(request.result.headers)
            }
          ));
        } else {
          resolve(null);
        }
      }
      request.onerror = (event) => {
        resolve(null);
      }
    })
    
    return promise;
  }
  
  _getObjectStore() {
    var transaction = this.db.transaction(["files"], "readwrite");
    var objectStore = transaction.objectStore("files");
    return objectStore;
  }
}