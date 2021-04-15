export default class DualKeyMap {

  constructor() {
    this._leftToMiddle = new Map();
  }
  
  add(primaryKey, secondaryKey, value) {
    this.getOrCreate(primaryKey, secondaryKey, () => value);
  }

  remove(primaryKey) {
    if(!this.hasPrimary(primaryKey)) return;
    for(const secondaryKey of this.getMiddles(primaryKey)) {
      this._middleToRight.delete(secondaryKey);      
    }
    this._leftToMiddle.delete(primaryKey);
  }

  removeSecondary(primaryKey, secondaryKey) {
    if(!this.has(primaryKey, secondaryKey)) return;
    this.getMiddles(primaryKey).delete(secondaryKey);
    if(this.getMiddles(primaryKey).size === 0) {
      this._leftToMiddle.delete(primaryKey);
    }
  }

  clear() {
    this._leftToMiddle.clear();
  }

  hasPrimary(primaryKey) {
    return this._leftToMiddle.has(primaryKey);
  }
  
  has(primaryKey, secondaryKey) {
    if(!this.hasPrimary(primaryKey)) return false;    
    return this.getMiddles(primaryKey).has(secondaryKey);
  }
  
  getMiddles(primaryKey) {
    return this._leftToMiddle.get(primaryKey);
  }

  get(primaryKey, secondaryKey) {
    if(!this.has(primaryKey, secondaryKey)) return undefined;
    return this._leftToMiddle.get(primaryKey).get(secondaryKey);
  }
  
  getOrCreate(primaryKey, secondaryKey, creatorFunction) {
    return this._leftToMiddle
      .getOrCreate(primaryKey, () => new Map())
      .getOrCreate(secondaryKey, creatorFunction);
  }
  
  allValues() {
    return [...this._leftToMiddle.values()].flatMap(inner => [...inner.values()]);
  }
  
}
