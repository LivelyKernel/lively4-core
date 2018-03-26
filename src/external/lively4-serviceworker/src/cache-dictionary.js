import { DbObject } from './dbobject.js';

/**
 * A key-value store used by the cache
 * that uses the browser Cache API
 */
export class Dictionary {
  
  constructor(storeName) {
    this.storeName = storeName
  }
  
  
  /**
   * Stores a new key value pair or updates an existing value
   */
  async put(key, resp) {
    let cache = await caches.open(this.storeName)
 
    key = this._sanitizeKey(key);
 
    // let data = new Object();
    // data.value = value;
    // data.timestamp = Date.now();
  
    return cache.put(key, resp)
  }
  
  /**
   * Retrieves a value for a given key, or `null` if no value was found
   * @return Promise
   */
  async match(key) {
    let cache = await caches.open(this.storeName)
    key = this._sanitizeKey(key);
    return cache.match(key) 
  }
  
  /**
   * Retrieves and removes the first item
   * @return Promise
   */
  async pop() {
    return Promise.resolve(undefined) // what is it used for? #TODO
  }
  
  /**
   * Deletes an entry from the dictionary
   * @param key the Key of the entry to delete
   */
  delete(key) {
    return Promise.resolve(undefined) // what is it used for? #TODO      
  }
  
  /**
   * Clears all storage data.
   */
  clear() {
    return Promise.resolve(undefined) // what is it used for? #TODO
  }
  
  /**
   * Returns all entries as array with tuples(key, object)
   * @return [[key0, object0], [key1, object1], ...]
   */
  toArray() {
    return [] // #TODO
  }
  
  /**
   * Returns all entries as dictionary
   * @return Dictionary containing all key-value pairs
   */
  toDictionary() {
    return [] // #TODO
  }
  
  /**
   * Sanitizes a key to handle a single file having multiple names, e.g. folders with and without trainling slash
   */
  _sanitizeKey(key) {
    return key.trim().replace(/\/+$/, "");
  }
}