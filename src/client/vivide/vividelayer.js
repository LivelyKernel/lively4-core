import VivideObject from 'src/client/vivide/vivideobject.js';

/**
 * Stores the objects of one layer and links to descending layers.
 */
export default class VivideLayer {
  constructor(data) {
    this._objects = [];
    this._rawData = data;
    
    this.makeObjectsFromRawData();
  }
  
  get objects() {
    return this._objects;
  }
  
  makeObjectsFromRawData() {
    this._objects.length = 0;
    for (let entry of this._rawData) {
      this._objects.push(new VivideObject(entry));
    }
  }
  static fromForest(forest) {
    lively.notify('VivideLayer::fromForest')
    const vivideLayer = new VivideLayer([]);
    vivideLayer._objects = forest.slice(0);
    
    return vivideLayer;
  }
}
