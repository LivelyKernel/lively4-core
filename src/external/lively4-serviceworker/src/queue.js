/**
 * An indexedDB-backed queue to be used by the cache
 */
export class Queue {
  constructor() {
    this._dbName = 'lively-sw-queue',
    this._storeName = 'queue';
    
    var request = indexedDB.open(this._dbName, 1);
    
    request.onupgradeneeded = (event) => {
      this.db = event.target.result;
      this.db.createObjectStore(this._storeName, {
        keyPath: 'id',
        autoIncrement: true
      });
    };
    
    request.onsuccess = (event) => {
      this.db = event.target.result;
    }
  }
  
  /**
   * Puts a new item in the queue
   */
  enqueue(item) {
    this._getObjectStore().put(item);
  }
  
  /**
   * Retrieves an item from the queue
   * @return Promise
   */
  /*dequeue() {
    return new Promise((resolve, reject) => {
      var request = this._getObjectStore().openCursor();
      request.onsuccess = (event) => {
        if(request.result) {
          // Copy result
          result = {}.assign(request.result);
          
          // Remove from DB
          deleteRequest = this._getObjectStore().delete(result.);
          resolve(request.result);
        } else {
          resolve(null);
        }
      }
      request.onerror = (event) => {
        resolve(null);
      }
    });
  }*/
  
  /**
   * Gets the objectStore from IndexedDB
   * @return ObjectStore
   */
  _getObjectStore() {
    var transaction = this.db.transaction([this._storeName], "readwrite");
    var objectStore = transaction.objectStore(this._storeName);
    return objectStore;
  }
}