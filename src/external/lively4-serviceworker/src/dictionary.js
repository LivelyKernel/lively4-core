import { DbObject } from './dbobject.js';

/**
 * A key-value store used by the cache
 * Currently uses IndexedDB to store data
 */
export class Dictionary extends DbObject {
  
  
  constructor(storeName) {
    Dictionary._maxCacheTime = 30 * 1000;
    super(storeName);
    this._connect(this._onconnect.bind(this));
  }
  
  _onconnect() {
    var objectStore = this._getObjectStore();
    var request = objectStore.openCursor();
    
    request.onsuccess = function(event) {
      var cursor = event.target.result;
      
      if (cursor) {
        if (Date.now() - cursor.value.timestamp > Dictionary._maxCacheTime) {
          // Delete old object
          console.log(Date.now() - cursor.value.timestamp);
          //this._getObjectStore().delete(cursor.key);
        }
        cursor.continue();
      }
    };
  }
  
  /**
   * Stores a new key value pair or updates an existing value
   */
  put(key, value) {
    var data = new Object();
    data.value = value;
    data.timestamp = Date.now();
    this._getObjectStore().put(data, key);
  }
  
  /**
   * Retrieves a value for a given key, or `null` if no value was found
   * @return Promise
   */
  match(key) {
    return new Promise((resolve, reject) => {
      var request = this._getObjectStore().get(key);
      request.onsuccess = (event) => {
        if (request.result) {
          resolve(request.result);
        } else {
          resolve(null);
        }
      }
      request.onerror = (event) => {
        resolve(null);
      }
    });
  }
  
  /**
   * Retrieves the first item
   * @return Promise
   */
  pop() {
    return new Promise((resolve, reject) => {
      // Get oldest entry
      var request = this._getObjectStore().openCursor();
      request.onsuccess = (event) => {
        if (request.result) {
          // Delete entry from DB
          this._getObjectStore().delete(request.result.key).onsuccess = () => {
            // Return value
            resolve(request.result.value.value);
          };
        } else {
          resolve(null);
        }
      }
      request.onerror = (event) => {
        resolve(null);
      }
    });
  }
}