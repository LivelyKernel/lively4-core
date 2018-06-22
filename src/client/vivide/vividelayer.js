import VivideObject from 'src/client/vivide/vivideobject.js';

/**
 * Stores the objects of one layer and links to descending layers.
 */
export default class VivideLayer {
  constructor(data) {
    this._objects = [];
    this._rawData = data;
    this._modules = {'transform': [], 'extract': [], 'descent': []};
    this._script = null;
    this._childScript = null;
    
    for (let entry of data) {
      let object = new VivideObject(entry);
      this.processData(object);
    }
  }
  
  get objects() {
    return this._objects;
  }
  
  get script() {
    return this._script;
  }
  
  set script(value) {
    this._script = value;
    return this._script;
  }
  
  get childScript() {
    return this._childScript;
  }
  
  set childScript(value) {
    this._childScript = value;
    return this._childScript;
  }
  
  clearData() {
    this._rawData.length = 0;
  }
  
  push(data) {
    this._rawData.push(data);
  }
  
  async processData() {
    await this.transform();
    
    // Reset object array and insert new transformed data
    this._objects.length = 0;
    for (let entry of this._rawData) {
      this._objects.push(new VivideObject(entry));
    }
    
    await this.extract();
    await this.descent();
  }
  
  async transform() {
    for (let transform of this._modules.transform) {
      let tmp = this._rawData.slice(0);
      this.clearData();
      await transform.value(tmp, this);
    }
  }
  
  async extract() {
    for (let module of this._modules.extract) {
      for (let object of this._objects) {
        object.addProperties(await module.value(object.data));
      }
    }
  }
  
  async descent() {
    for (let module of this._modules.descent) {
      for (let object of this._objects) {
        let childData = await module.value(object.data);
        
        if (!childData) continue;
        
        let childLayer = new VivideLayer(childData);
        childLayer.script = this._childScript;
        object.childLayer = childLayer;
      }
    }
  }
  
  addModule(module, type) {
    this._modules[type].push(module);
  }
}