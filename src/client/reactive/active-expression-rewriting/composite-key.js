export default class CompositeKey {

  constructor() {
    this._compositeKeyStore = new Map();
    this._compositeKeyStoreReverse = new Map();
  }

  _newMap() { return new Map(); }
  
  _getByPrimaryKey(obj1) {
    return this._compositeKeyStore.getOrCreate(obj1, this._newMap);
  }
  _get(obj1, obj2) {
    const secondKeyMap = this._getByPrimaryKey(obj1);
    if(!secondKeyMap.has(obj2)) {
      const compKey = {};
      secondKeyMap.set(obj2, compKey);
      this._compositeKeyStoreReverse.set(compKey, [obj1, obj2]);
    }
    return secondKeyMap.get(obj2);
  }
  
  for(obj1, obj2) {
    return this._get(obj1, obj2);
  }
  
  /**
   * Reverse operation of @link(for)
   */
  keysFor(compKey) {
    return this._compositeKeyStoreReverse.get(compKey) || [];
  }
  
  remove(compKey) {
    const [obj1, obj2] = this._compositeKeyStoreReverse.get(compKey);
    
    const secondKeyMap = this._getByPrimaryKey(obj1);
    secondKeyMap.delete(obj2);
    if(secondKeyMap.size === 0) {
      this._compositeKeyStore.delete(obj1);
    }
    this._compositeKeyStoreReverse.delete(compKey);
  }
  
  clear() {
    this._compositeKeyStore.clear();
    this._compositeKeyStoreReverse.clear();
  }
}
