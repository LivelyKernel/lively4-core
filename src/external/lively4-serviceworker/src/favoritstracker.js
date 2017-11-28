import { DbObject } from './dbobject.js';

/**
 * Tracks most frequently(recently?) used files.
 * Currently uses IndexedDB to store data
 */
export class FavoritsTracker extends DbObject {
  constructor() {
    super('favorits');
    this._connect(); 
  }
  
  /**
   * Updates the favorit count for a given key.
   */
  update(key) {
    var objectStore = this._getObjectStore();
    var request = objectStore.get(key);
    
    request.onsuccess = (event) => {
      if (request.result) {
        objectStore.put(request.result + 1, key);
      } else {
        objectStore.put(1, key);
      }
    }
  }
}