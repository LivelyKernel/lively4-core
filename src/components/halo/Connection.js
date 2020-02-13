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
    let ending = '';
    if(targetProperty.includes('style')){
      ending = " + 'pt'"
    }
    if(isEvent){
      this.valueModifyingCode = "(target, sourceValue) => {target." + targetProperty + " = 42" + ending + "}";
    } else {
      this.valueModifyingCode = "(target, sourceValue) => {target." + targetProperty + " = sourceValue*1" + ending + "}"
    }
    
    this.makeSavingScript();
  }
  
  makeSavingScript(){
    this.targetId = uuid();
    this.sourceId = uuid();
    this.target.setAttribute('connectionId', this.targetId);
    this.source.setAttribute('connectionId', this.sourceId);
    this.saveSerializedConnectionIntoWidget();
  }
  
  saveSerializedConnectionIntoWidget(){
    this.source.setJSONAttribute('data-connection', this.serialize());
  }
  
  serialize(){
    return {
      sourceId: this.sourceId,
      targetId: this.targetId,
      sourceProperty: this.sourceProperty,
      code: this.valueModifyingCode,
      isEvent: this.isEvent
    }
  }
  
  static deserialize(json){
    this.connectionFromExistingData(json.targetId, json.code, json.sourceId, json.sourceProperty, json.isEvent)
  }
  
  static deserializeFromObjectIfNeeded(object) {
    if (object.hasAttribute && object.hasAttribute('data-connection')) {
      this.deserialize(object.getJSONAttribute('data-connection'))
    }
  }
  
  static connectionFromExistingData(targetId, modifyingCode, sourceId, sourceProperty, isEvent){
    let target = document.body.querySelector(`[connectionId="${targetId}"]`);
    let source = document.body.querySelector(`[connectionId="${sourceId}"]`);
    let undeadConnection = new Connection(target, 'something', source, sourceProperty, isEvent);
    undeadConnection.setModifyingCodeString(modifyingCode);
    undeadConnection.activate();
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
    this.source.addEventListener(this.sourceProperty, evt => this.connectionFunction(evt))
  }
  
  activateAexpr(){
    this.ae = aexpr(() => this.source[this.sourceProperty]);
    this.ae.onChange(svalue => this.connectionFunction(svalue));
  }
  
  async connectionFunction(sourceValue){  
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
  
  toggleDirection(){
    this.deactivate();
    let oldTarget = this.target;
    this.target = this.source;
    this.source = oldTarget;
    this.saveSerializedConnectionIntoWidget();
    this.activate();
  }
  
  copyAndActivate(){
    let newConnection = new Connection(this.target, this.targetProperty, this.source, this.sourceProperty, this.isEvent);
    newConnection.setModifyingCodeString(this.valueModifyingCode);
    newConnection.activate();
    return newConnection;
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
    this.saveSerializedConnectionIntoWidget();
    this.activate();
  }
  
  
  getModifyingCodeString(){
    return this.valueModifyingCode
  }
  
  setModifyingCodeString(newCode){
    this.valueModifyingCode = newCode;
    this.saveSerializedConnectionIntoWidget();
  }
  
  static get allConnections(){
    return window.allConnections
  }
  
  connectionString(){
    return 'Connection ' + this.id
  }
  
}

window.allConnections.forEach(connection => {
    // evil live programming
    connection.constructor === Connection

    // we can fix this, so we can do live development again....
    connection.__proto__ = Connection.prototype
  });