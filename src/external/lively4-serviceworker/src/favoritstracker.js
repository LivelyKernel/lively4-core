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
    var value = 0;
    this._getObjectStore().put(value, key);
  }
}