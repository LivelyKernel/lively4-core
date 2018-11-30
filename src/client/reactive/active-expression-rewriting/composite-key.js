const compositeKeyStore = new Map();
const compositeKeyStoreReverse = new Map();

export default class CompositeKey {
  static _getByPrimaryKey(obj1) {
    if(!compositeKeyStore.has(obj1)) {
      compositeKeyStore.set(obj1, new Map());
    }

    return compositeKeyStore.get(obj1);
  }
  static _get(obj1, obj2) {
    const secondKeyMap = this._getByPrimaryKey(obj1);
    if(!secondKeyMap.has(obj2)) {
      const compKey = {};
      secondKeyMap.set(obj2, compKey);
      compositeKeyStoreReverse.set(compKey, [obj1, obj2]);
    }
    return secondKeyMap.get(obj2);
  }
  
  static for(obj1, obj2) {
    return this._get(obj1, obj2);
  }
  
  /**
   * Reverse operation of @link(for)
   */
  static keysFor(compKey) {
    return compositeKeyStoreReverse.get(compKey) || [];
  }
  
  static clear() {
    compositeKeyStore.clear();
    compositeKeyStoreReverse.clear();
  }
}
