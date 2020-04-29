export class DefaultMap extends Map {
  constructor(defaultInit, iterable) {
    super(iterable);
    this._defaultInit = defaultInit;
  }
  
  static builder(defaultInit) {
    return DefaultMap.bind(null, defaultInit);
  }
  
  get(key) {
    if(!this.has(key)) {
      const defaultValue = typeof this._defaultInit === 'function' ? 
                           new this._defaultInit() :
                           this._defaultInit;
      this.set(key, defaultValue);
    }
    return super.get(key);
  }
}
