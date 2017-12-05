import { DbObject } from './dbobject.js';

/**
 * A key-value store used by the cache
 * Currently uses IndexedDB to store data
 */
export class Dictionary extends DbObject {
  
  
  constructor() {
    Dictionary._maxCacheTime = 30 * 1000;
    super('dictionary');
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
}