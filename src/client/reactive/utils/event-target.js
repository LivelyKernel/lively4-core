/**
 * A slightly smarter EventTarget class
 */
export default class EventTarget {
  constructor() {
    this.callbacks = new Map();
  }
  
  _callbacksFor(type) {
    return this.callbacks.getOrCreate(type, () => new Set());
  }

  addEventListener(type, callback) {
    const callbacks = this._callbacksFor(type);
    callbacks.add(callback);
  }

  removeEventListener(type, callback) {
    const callbacks = this._callbacksFor(type);
    callbacks.delete(callback);
  }

  dispatchEvent(type, ...params) {
    const callbacks = this._callbacksFor(type);
    callbacks.forEach(callback => callback.apply(undefined, params));
  }

  getEventListeners(type) {
    return Array.from(this._callbacksFor(type));
  }
}
