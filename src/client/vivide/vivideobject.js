import Annotations from 'src/client/reactive/active-expressions/active-expressions/src/annotations.js';

export default class VivideObject {
  constructor(data) {
    this._data = data;
    this._childLayer = null;
    this._properties = new Annotations();
  }
  
  get object() { return this._data; }
  get data() { return this._data; }
  
  get properties() {
    return this._properties;
  }
  
  addProperties(properties) {
    this._properties.add(properties);
  }
  
  get childLayer() { return this._childLayer; }
  set childLayer(childLayer) { return this._childLayer = childLayer; }
  
  hasChildren() {
    return this._childLayer !== null && this._childLayer.objects.length > 0;
  }
  
  // #TODO: memoize them
  async getChildren() {
    let childLayer = this.childLayer;

    // #TODO: replace with hasChildren
    if (!childLayer || !childLayer.objects.length) {
      return;
    }
    
    if (!childLayer.script) {
      return childLayer;
    }
    
    const childData = childLayer.objects.map(c => c.data);
    const step = childLayer.script;
    this.childLayer = await step.processData(childData);
    childLayer = this.childLayer;

    return childLayer;
  }
}
