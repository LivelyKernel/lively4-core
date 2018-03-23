import { DbObject } from './dbobject.js';

/**
 * A key-value store used by the cache
 * Currently uses IndexedDB to store data
 */
export class Dictionary extends DbObject {
  
  constructor(storeName) {
    super(storeName);
    this._connect();
  }
  
  /**
   * Stores a new key value pair or updates an existing value
   */
  async put(key, value) {
    key = this._sanitizeKey(key);
    
    let data = new Object();
    data.value = value;
    data.timestamp = Date.now();
    // Wrap IndexedDB call into a promise
    await new Promise((resolve, reject) => {
      let dbRequest = this._getObjectStore().put(data, key);
      dbRequest.onsuccess = resolve;
      dbRequest.onerror = reject;
    });
  }
  
  /**
   * Retrieves a value for a given key, or `null` if no value was found
   * @return Promise
   */
  match(key) {
    key = this._sanitizeKey(key);
    // var lookupStart = performance.now()
    return new Promise((resolve, reject) => {
      let request = this._getObjectStore("readonly").get(key);
      request.onsuccess = (event) => {
        if (request.result) {
          // console.log("dictionary lookup " + key + " took " + (performance.now() - lookupStart) + "ms")
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
   * Retrieves and removes the first item
   * @return Promise
   */
  pop() {
    return new Promise((resolve, reject) => {
      // Get oldest entry
      let request = this._getObjectStore().openCursor();
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
  
  /**
   * Deletes an entry from the dictionary
   * @param key the Key of the entry to delete
   */
  delete(key) {
    key = this._sanitizeKey(key);
    
    return new Promise((resolve, reject) => {
      let dbRequest = this._getObjectStore().delete(key);
      dbRequest.onsuccess = resolve;
      dbRequest.onerror = reject;
    });
  }
  
  /**
   * Clears all storage data.
   */
  clear() {
    return new Promise((resolve, reject) => {
      let dbRequest = this._getObjectStore().clear();
      dbRequest.onsuccess = resolve;
      dbRequest.onerror = reject;
    });
  }
  
  /**
   * Returns all entries as array with tuples(key, object)
   * @return [[key0, object0], [key1, object1], ...]
   */
  toArray() {
    let objectStore = this._getObjectStore("readonly");
    let request = objectStore.openCursor();
    
    return new Promise((resolve, reject) => {
      let entries = [];
      
      request.onsuccess = (event) => {
        let cursor = event.target.result;

        if (cursor) {
          entries.push([cursor.key, cursor.value]);
          cursor.continue();
        } else {
          // All entries read, traverse and load favorites 
          resolve(entries);
        }
      };
    });
  }
  
  /**
   * Returns all entries as dictionary
   * @return Dictionary containing all key-value pairs
   */
  toDictionary() {
    let objectStore = this._getObjectStore("readonly");
    let request = objectStore.openCursor();
    
    return new Promise((resolve, reject) => {
      let entries = {};
      
      request.onsuccess = (event) => {
        let cursor = event.target.result;

        if (cursor) {
          entries[cursor.key] = cursor.value;
          cursor.continue();
        } else {
          // All entries read, traverse and load favorites 
          resolve(entries);
        }
      };
    });
  }
  
  /**
   * Sanitizes a key to handle a single file having multiple names, e.g. folders with and without trainling slash
   */
  _sanitizeKey(key) {
    return key.trim().replace(/\/+$/, "");
  }
}