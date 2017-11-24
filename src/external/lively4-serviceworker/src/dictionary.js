import { DbObject } from './dbobject.js';

/**
 * A key-value store used by the cache
 * Currently uses IndexedDB to store data
 */
export class Dictionary extends DbObject {
  constructor() {
    super('dictionary');
    this._connect();
    // TODO: Invalidate old objects
  }
  
  /**
   * Stores a new key value pair or updates an existing value
   */
  put(key, value) {
    this._getObjectStore().put(value, key);
  }
  
  /**
   * Retrieves a value for a given key, or `null` if no value was found
   * @return Promise
   */
  match(key) {
    return new Promise((resolve, reject) => {
      var request = this._getObjectStore().get(key);
      request.onsuccess = (event) => {
        if(request.result) {
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