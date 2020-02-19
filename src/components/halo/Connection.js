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
    this._targetProperty = targetProperty;
    this.source = source;
    this.sourceProperty = sourceProperty;
    this.isEvent = isEvent;
    this.isActive = false
    let ending = '';
    if(this._targetProperty.includes('style')){
      ending = " + 'pt'"
    }
    if(isEvent){
      this.valueModifyingCode = "(target, event) => {target." + this._targetProperty + " = 42" + ending + "}";
    } else {
      this.valueModifyingCode = "(target, sourceValue) => {target." + this._targetProperty + " = sourceValue*1" + ending + "}"
    }
    
    this.makeSavingScript();
  }
  
  makeSavingScript(){
    if(this.target.hasAttribute('connectionId')){
      this.targetId = this.target.getAttribute('connectionId');
    } else {
      this.targetId = uuid();
      this.target.setAttribute('connectionId', this.targetId);
    }
     if(this.source.hasAttribute('connectionId')){
      this.sourceId = this.source.getAttribute('connectionId');
    } else {
      this.sourceId = uuid();
      this.source.setAttribute('connectionId', this.sourceId);
    }
    this.saveSerializedConnectionIntoWidget();
  }
  
  saveSerializedConnectionIntoWidget(){
    const serializedConnections = Array.from(window.allConnections)
      .filter(connection => connection.source === this.source)
      .map(connection => connection.serialize())
    this.source.setJSONAttribute('data-connection', serializedConnections);
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
    json.forEach(connectionData => {
      this.connectionFromExistingData(connectionData.targetId, connectionData.code, connectionData.sourceId, connectionData.sourceProperty, connectionData.isEvent)
    })
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
  
  activateEvent() {
    this._eventListener = evt => this.connectionFunction(evt)
    lively.addEventListener('Connections', this.source, this.sourceProperty, this._eventListener)
    //this.source.addEventListener(this.sourceProperty, evt => this.connectionFunction(evt))
  }
  
  async activateAexpr() {
    this.trackingCode = `(source) => {
  return source.${this.sourceProperty};
}`
    let myFunction = await this.trackingCode.boundEval()
    this.ae = aexpr(() => myFunction(this.source));
    this.ae.onChange(svalue => this.connectionFunction(svalue));
  }
  
  async connectionFunction(sourceValue){  
    let myFunction = await this.valueModifyingCode.boundEval()
    myFunction(this.target, sourceValue)
  }
  
  drawConnectionLine() {
    let line = [lively.getGlobalPosition(this.source), lively.getGlobalPosition(this.target)];
    lively.showPath(line, "rgba(80,180,80,1)", true);
  }
  
  setActive(shouldBeActive) {
    if(shouldBeActive){
      this.activate()
    }
    else{
       this.deactivate()
    }
  }
  
  toggleDirection() {
    this.deactivate();
    let oldTarget = this.target;
    this.target = this.source;
    this.source = oldTarget;
    this.saveSerializedConnectionIntoWidget();
    this.activate();
  }
  
  copyAndActivate() {
    let newConnection = new Connection(this.target, this._targetProperty, this.source, this.sourceProperty, this.isEvent);
    newConnection.setModifyingCodeString(this.valueModifyingCode);
    newConnection.activate();
    return newConnection;
  }
  
  deactivate() {
    this.ae && this.ae.dispose()
    if(this.isEvent){
      lively.removeEventListener ('Connections', this.source, this.sourceProperty, this._eventListener)
    }
    this.isActive = false
  }
  
  destroy() {
    this.deactivate()
    window.allConnections.delete(this)
  }
  
  getSource() {
    return this.source
  }
  
  getSourceId() {
    return this.sourceId
  }
  
  getTarget() {
    return this.target
  }
  
  getTargetId() {
    return this.targetId
  }
  
  getAexpr() {
    return this.ae
  }
  
  getSourceProperty() {
    return this.sourceProperty
  }
  
  setSourceProperty(newProperty) {
    this.sourceProperty = newProperty;
    this.saveSerializedConnectionIntoWidget();
    this.activate();
  }
  
  
  getModifyingCodeString() {
    return this.valueModifyingCode
  }
  
  setModifyingCodeString(newCode) {
    this.valueModifyingCode = newCode;
    this.saveSerializedConnectionIntoWidget();
  }
  
  static get allConnections() {
    return window.allConnections
  }
  
  static allConnectionsFor(object) {
    let connections = [];
    if (object.hasAttribute && object.hasAttribute('connectionId')) {
      let objectId = object.getAttribute('connectionId');
      this.allConnections.forEach(connection => {
        if((connection.getTargetId() == objectId) || (connection.getSourceId() == objectId)) {connections.push(connection)}
      })
    }
    return connections
  }
  
  connectionString() {
    return 'Connection ' + this.id
  }
  
}

window.allConnections.forEach(connection => connection.migrateTo(Connection));