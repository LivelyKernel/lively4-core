import { uuid } from 'utils';

export default class Script {
  constructor(source, type) {
    this.id = uuid();
    this.source = source;
    this.type = type;
    this.nextScript = null;
  }
  
  set next(value) {
    if (!(value instanceof Script)) {
      throw "Value not of type Script";
    }
    
    this.nextScript = value;
  }
}