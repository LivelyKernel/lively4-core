export default class MultiMap {

  constructor() {
    this._domainToRange = new Map();
  }
  
  add(key, value) {
    this.get(key).add(value);
  }
  
  delete(key, value) {
    this.get(key).delete(value);
  }

  removeAllFor(key) {
    this.get(key).clear();
  }

  clear() {
    this._domainToRange.clear();
  }

  get(key) {
    return this._domainToRange.getOrCreate(key, () => new Set());
  }

}
