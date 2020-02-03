"enable aexpr";
import {pt} from 'src/client/graphics.js';
import {uuid} from 'utils';

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
    this.valueModifyingCode = "(target, sourceValue) => {target.style.height = sourceValue*1 + 'pt'}"
    
    this.makeSavingScript();
  }
  
  makeSavingScript(){
    this.targetId = uuid();
    this.sourceId = uuid();
    this.target.setAttribute('connectionId', this.targetId);
    this.source.setAttribute('connectionId', this.sourceId);
    //this.target.setAttribute('connectionInfo', [targetId, this.valueModifyingCode, sourceId, this.sourceProperty]);
    //let script = <script type="lively4script" data-name="livelyload">import {uuid} from 'utils'; alert(uuid())</script>;
    this.source.setJSONAttribute('data-connection', this.serialize());
  }
  
  static reinitializeFor(target){
    let targetId = target.getAttribute('connectionInfo')[0];
    let code = target.getAttribute('connectionInfo')[1];
    let sourceId = target.getAttribute('connectionInfo')[2];
    let sProperty = target.getAttribute('connectionInfo')[3];
    this.connectionFromExistingData(targetId, code, sourceId, sProperty);
    
  }
  
  serialize(){
    return {
      sourceId: this.sourceId,
      targetId: this.targetId,
      sourceProperty: this.sourceProperty,
      code: this.valueModifyingCode
    }
  }
  
  static deserialize(json){
    debugger
    this.connectionFromExistingData(json.targetId, json.code, json.sourceId, json.sourceProperty)
  }
  
  static connectionFromExistingData(targetId, modifyingCode, sourceId, sourceProperty){
    let target = document.body.querySelector(`[connectionId="${targetId}"]`);
    let source = document.body.querySelector(`[connectionId="${sourceId}"]`);
    let undeadConnection = new Connection(target, 'something', source, sourceProperty, false);
    undeadConnection.setModifyingCodeString(modifyingCode);
    undeadConnection.activate();
    return undeadConnection;
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
    /*let code = sourceValue + this.valueModifyingCode
    let result = await code.boundEval()
    this.target.style[this.targetProperty] = result*/
    
    let myFunction = await this.valueModifyingCode.boundEval()
    myFunction(this.target, sourceValue)
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
  
  getSourceProperty(){
    return this.sourceProperty
  }
  
  setSourceProperty(newProperty){
    this.sourceProperty = newProperty;
    this.activate();
  }
  
  getTargetProperty(){
    return this.targetProperty
  }
  
  setTargetProperty(newProperty){
    this.targetProperty = newProperty;
    this.activate();
  }
  
  getModifyingCodeString(){
    return this.valueModifyingCode
  }
  
  setModifyingCodeString(newCode){
    this.valueModifyingCode = newCode
  }
  
  static get allConnections(){
    return window.allConnections
  }
  
  connectionString(){
    return 'Connection ' + this.id
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