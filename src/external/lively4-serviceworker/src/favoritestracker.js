import { DbObject } from './dbobject.js';

/**
 * Tracks most frequently(recently?) used files.
 * Currently uses IndexedDB to store data
 */
export class FavoritesTracker extends DbObject {
  constructor() {
    super('favorites');
    this._connect(this._onconnect.bind(this));
    this.favorites = {};
  }
  
  _onconnect() {
    var objectStore = this._getObjectStore();
    var request = objectStore.openCursor();
    
    request.onsuccess = (event) => {
      let cursor = event.target.result;
      
      if (cursor) {
        this.favorites[cursor.key] = cursor.value
        cursor.continue();
      } else {
        // Traverse and load favorites 
      }
    };
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