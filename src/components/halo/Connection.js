"enable aexpr";
import {pt} from 'src/client/graphics.js';
//import {uuid} from 'utils';

window.allConnections = window.allConnections || new Set()

export default class Connection {
  
  static nextId(){
    this._currentId = this._currentId || 1
    return this._currentId++
  }
  
  constructor(target, targetProperty, source, sourceProperty, isEvent) {
    this.id = Connection.nextId();
    window.allConnections.add(this);
    
    this.target = target;
    this.targetProperty = targetProperty;
    this.source = source;
    this.sourceProperty = sourceProperty;
    this.isEvent = isEvent;
    this.isActive = false
    this.valueModifyingCode = '+"pt"'
  }
  
  activate(){
    
    if(this.isActive){
       this.deactivate()
    }
    
    if(this.isEvent){
      this.activateEvent()
    }
    else {
      this.activateAexpr()
    }
    this.isActive = true
  }
  
  activateEvent(){
    this.source.addEventListener('click', () => this.target.style.width = this.target.style.width*2+"pt")
  }
  
  activateAexpr(){
    this.ae = aexpr(() => this.source[this.sourceProperty]);
    this.ae.onChange(svalue => this.connectionFunction(svalue));
  }
  
  async connectionFunction(sourceValue){
    let code = sourceValue + this.valueModifyingCode
    let result = await code.boundEval()
    
    this.target.style[this.targetProperty] = result
  }
  
  drawConnectionLine(){
    let line = [lively.getGlobalPosition(this.source), lively.getGlobalPosition(this.target)];
    lively.showPath(line, "rgba(80,180,80,1)", true);
  }
  
  setActive(shouldBeActive){
    if(shouldBeActive){
      this.activate()
    }
    else{
       this.deactivate()
    }
  }
  
  deactivate(){
    this.ae && this.ae.dispose()
    this.isActive = false
  }
  
  destroy(){
    this.deactivate()
    window.allConnections.delete(this)
  }
  
  getSource(){
    return this.source
  }
  
  getTarget(){
    return this.target
  }
  
  getAexpr(){
    return this.ae
  }
  
  getModifyingCodeString(){
    return this.valueModifyingCode
  }
  
  static get allConnections(){
    return window.allConnections
  }
  
  connectionString(){
    return 'Connection ' + this.id
  }
  
  changeModifyingCode(newCode){
    this.valueModifyingCode = newCode
  }
}

// #UPDATE_INSTANCES
// #TODO: idea: using a list of all object, we can make them become anew
// go through all object reachable from window
window.allConnections.forEach(connection => {
    // evil live programming
    connection.constructor === Connection

    // we can fix this, so we can do live development again....
    connection.__proto__ = Connection.prototype
  });