import { DbObject } from './dbobject.js';

/**
 * An indexedDB-backed queue to be used by the cache
 */
export class Queue extends DbObject {
  constructor() {
    super('queue');
    this._connect();
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
  dequeue() {
    return new Promise((resolve, reject) => {
      // Get oldest entry
      var request = this._getObjectStore().openCursor();
      request.onsuccess = (event) => {
        if (request.result) {
          // Delete entry from DB
          this._getObjectStore().delete(request.result.key).onsuccess = () => {
            // Return value
            resolve(request.result.value);
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