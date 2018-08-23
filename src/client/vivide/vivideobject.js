import Annotations from 'src/client/reactive/active-expressions/active-expressions/src/annotations.js';

export default class VivideObject {
  static forestToData(forest) {
    return forest.map(model => model.object);
  }
  
  static dataToForest(data) {
    return data.map(d => new VivideObject(d));
  }

  constructor(data) {
    this._data = data;
    this._properties = new Annotations();
    this._childLayer = null;
    this._childStep = null;
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
  
  get childStep() { return this._childStep; }
  set childStep(childStep) { return this._childStep = childStep; }
  
  async hasChildren() {
    lively.notify('VivideObject::hasChildren');
    const children = await this.getChildren();
    
    return children && children.length > 0;
  }
  
  // #TODO: memoize them
  async getChildren() {
    // lively.error("childData")

    // ? we are after a descent step, so no childData and no childStep
    // #TODO: restructure descent step
    if (!this.childData) {
      return [];
    }
    
    // nothing after descent step
    if (!this.childStep) {
      return VivideObject.dataToForest(this.childData);
    }
    
    const step = this.childStep;
    const forest = await step.processData(this.childData);
    return forest;
  }
}
