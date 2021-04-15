export default class MultiMap {

  constructor() {
    this._domainToRange = new Map();
    this._rangeToDomain = new Map();
  }
  
  add(key, value) {
    this.getOrCreate(key).add(value);
  }
  
  delete(key, value) {
    if(!this.has(key)) return;
    this.get(key).delete(value);
  }

  remove(key) {
    if(!this.has(key)) return;
    for(const value of this.get(key)) {
      this.rangeToDomain.delete(value);      
    }
    this._domainToRange.delete(key);
  }

  clear() {
    this._domainToRange.clear();
  }

  has(key) {
    return this._domainToRange.has(key);
  }
  
  get(key) {
    return this._domainToRange.get(key);
  }

  getOrCreate(key) {
    return this._domainToRange.getOrCreate(key, () => new Set());
  }
  
  getKey(value) {
    this._rangeToDomain.get(value);
  }
  
}
