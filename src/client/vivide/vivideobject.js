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
    this._descentStep = null;
  }
  
  get object() { return this._data; }
  get data() { return this._data; }
  
  get properties() {
    return this._properties;
  }
  
  get descentStep() { return this._descentStep; }
  set descentStep(descentStep) { return this._descentStep = descentStep; }
  
  async hasChildren() {
    const children = await this.getChildren();
    
    return children && children.length > 0;
  }
  
  async computeChildren() {
    if(!this.descentStep) {
      // #TODO: better: undefined? (to signal the absense of a descent script)
      return [];
    }
    
    const forest = await this.descentStep.descentObject(this.object);
    return forest;
  }
  
  async getChildren() {
    return this._children = this._children || await this.computeChildren();
  }
}
