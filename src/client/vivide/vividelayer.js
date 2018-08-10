import VivideObject from 'src/client/vivide/vivideobject.js';

/**
 * Stores the objects of one layer and links to descending layers.
 */
export default class VivideLayer {
  constructor(data) {
    this._objects = [];
    this._rawData = data;
    this._modules = {
      transform: [],
      extract: [],
      descent: []
    };
    this._script = null;
    this._childScript = null;
    
    this.makeObjectsFromRawData();
  }
  
  get objects() {
    return this._objects;
  }
  
  get script() { return this._script; }
  set script(script) { return this._script = script; }
  
  get childScript() { return this._childScript; }
  set childScript(childScript) { return this._childScript = childScript; }
  
  makeObjectsFromRawData() {
    this._objects.length = 0;
    for (let entry of this._rawData) {
      this._objects.push(new VivideObject(entry));
    }
  }
}