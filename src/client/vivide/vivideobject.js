import Annotations from 'src/client/reactive/active-expressions/active-expressions/src/annotations.js';

export default class VivideObject {
  constructor(data) {
    this._data = data;
    this._childLayer = null;
    this._properties = new Annotations();
  }
  
  get data() {
    return this._data;
  }
  
  get properties() {
    return this._properties;
  }
  
  addProperties(properties) {
    this._properties.add(properties);
  }
  
  get childLayer() { return this._childLayer; }
  set childLayer(childLayer) { return this._childLayer = childLayer; }
  
  get hasChildren() {
    return this._childLayer !== null && this._childLayer.objects.length > 0;
  }
}
