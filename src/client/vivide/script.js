import { uuid } from 'utils';

export default class Script {
  constructor(source, type, id = null, lastScript = false) {
    this.id = id != null ? id : uuid();
    this.source = source;
    this.type = type;
    this.nextScript = null;
    this.updateCallback = null;
    this.lastScript = lastScript;
  }
  
  set next(value) {
    if (!(value instanceof Script)) {
      throw "Value not of type Script";
    }
    
    this.nextScript = value;
  }
  
  update() {
    if (typeof this.updateCallback === 'function') {
      this.updateCallback();
    }
  }
}