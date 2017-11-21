import { DbObject } from './dbobject.js';

/**
 * Tracks most frequently(recently?) used files.
 * Currently uses IndexedDB to store data
 */
export class FavoritsTracker extends DbObject {
  constructor() {
    super('favorits');
<<<<<<< HEAD
    this._connect();
=======
    this._connect(); 
>>>>>>> c51e2658fca70ffe8c953edb6c1328279f923c2c
  }
  
  /**
   * Updates the favorit count for a given key.
   */
  update(key) {
<<<<<<< HEAD
    var value = 0;
    this._getObjectStore().put(value, key);
=======
    var objectStore = this._getObjectStore();
    var request = objectStore.get(key);
    
    request.onsuccess = (event) => {
      if(request.result) {
        objectStore.put(request.result + 1, key);
      } else {
        objectStore.put(0, key);
      }
    }
>>>>>>> c51e2658fca70ffe8c953edb6c1328279f923c2c
  }
}