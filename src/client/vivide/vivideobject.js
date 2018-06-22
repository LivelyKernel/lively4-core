export default class VivideObject {
  constructor(data) {
    this._data = data;
    this._childLayer = null;
    this._properties = [];
  }
  
  get data() {
    return this._data;
  }
  
  get properties() {
    return this._properties;
  }
  
  set childLayer(childLayer) {
    this._childLayer = childLayer;
  }
  
  get childLayer() {
    return this._childLayer;
  }
  
  addProperties(properties) {
    this._properties.push(properties);
  }
  
  get hasChildren() {
    return this._childLayer !== null && this._childLayer.objects.length > 0;
  }
}