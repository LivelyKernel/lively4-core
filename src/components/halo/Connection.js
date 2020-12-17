"enable aexpr";

window.allConnections = window.allConnections || new Set()

import { uuid } from 'utils';


export default class Connection {
  
  static nextId(){
    return uuid()
    // this._currentId = this._currentId || 1
    // return this._currentId++
  }
  
  constructor(source, sourceProperty, target, targetProperty, isEvent) {
    debugger
    this.id = Connection.nextId();
    window.allConnections.add(this);
    
    this.target = target;
    this._targetProperty = targetProperty;
    this.source = source;
    this._sourceProperty = sourceProperty;
    this.isEvent = isEvent;
    this.isActive = false
    this._eventListener = evt => this.connectionFunction(evt)
    this._targetProperty = this.cleanProperty(this._targetProperty)
    if(isEvent){
      this.modifyingCode = 
`(target, event) => {
  target.${this._targetProperty} = 42;
}`;
      this.trackingCode = this._sourceProperty;
    } else {
      this.modifyingCode = 
`(target, sourceValue) => {
  target.${this._targetProperty} = sourceValue;
}`;
      this._sourceProperty = this.cleanProperty(this._sourceProperty)
      this.trackingCode = `(source) => {
  return source.${this._sourceProperty};
}`
    }
    this.makeSavingScript();
  }
  
  get sourceProperty() {
    return this._sourceProperty
  }
  
  get targetProperty() {
    return this._targetProperty
  }
  
  
  cleanProperty(property) {
    return property.split(".").map(each => this.camelCaseIfNeeded(each)).join(".")
  }
  
  camelCaseIfNeeded(propertyPart) {
    if(propertyPart.includes('-')) {
      return propertyPart.camelCase();
    } else {
      return propertyPart;
    }
  }
  
  makeSavingScript() {
    if (this.target) {
      this.targetId = lively.ensureID(this.target);
    } 
    if (this.source) {
      this.sourceId = lively.ensureID(this.source);
    }
    if (this.target && this.source) {
      this.saveSerializedConnectionIntoWidget();
    }
  }
  
  saveSerializedConnectionIntoWidget() {
    if (!this.source) return; // cannot save it...
    const serializedConnections = Array.from(window.allConnections)
      .filter(connection => connection.source === this.source)
      .map(connection => connection.serialize())
    this.source.setJSONAttribute('data-connection', serializedConnections);
  }
  
  serialize() {
    return {
      sourceId: this.sourceId,
      targetId: this.targetId,
      sourceProperty: this._sourceProperty,
      targetProperty: this._targetProperty,      
      trackingCode: this.trackingCode,
      modifyingCode: this.modifyingCode,
      label: this.label,
      isEvent: this.isEvent
    }
  }
  
  static deserialize(json) {
    json.forEach(connectionData => {
      this.connectionFromExistingData(connectionData)
    })
  }
  
  static deserializeFromObjectIfNeeded(object) {
    if (object.hasAttribute && object.hasAttribute('data-connection')) {
      this.deserialize(object.getJSONAttribute('data-connection'))
    }
  }
  
  static connectionFromExistingData(config) {
    
    const target = lively.elementByID(config.targetId);
    const source = lively.elementByID(config.sourceId);
    const undeadConnection = new Connection(
        source, config.targetProperty, 
        target, config.sourceProperty,
        config.isEvent);
    undeadConnection.setModifyingCode(config.modifyingCode);
    undeadConnection.setTrackingCode(config.trackingCode);
    undeadConnection.setLabel(config.label);
    undeadConnection.activate();
  }
  
  activate() {
    
    if(this.isActive) {
       this.deactivate()
    }
    
    if(this.isEvent) {
      this.activateEvent()
    }
    else {
      this.activateAexpr()
    }
    this.isActive = true
  }
  
  async activateEvent() {
    if (this.source) {
      lively.addEventListener('Connections', this.source, this.trackingCode, this._eventListener);
    }
  }
  
  async activateAexpr() {
    let myFunction = await this.trackingCode.boundEval()
    this.ae = aexpr(() => myFunction(this.source));
    this.ae.onChange(svalue => this.connectionFunction(svalue));
  }
  
  getTrackingCode() {
    return this.trackingCode
  }
  
  setTrackingCode(string) {
    const isActive = this.isActive
    if(isActive){this.deactivate()}
    this.trackingCode = string;
    this.saveSerializedConnectionIntoWidget();
    if(isActive){this.activate()}
  }
  
  async connectionFunction(sourceValue) {  
    let myFunction = await this.modifyingCode.boundEval()
    myFunction(this.target, sourceValue)
  }
  
  async drawConnectionLine() {
    this.removeConnectionLine()
    var from = this.getSource()
    var to = this.getTarget()
    if (!from || !to) return
    
    var connector = document.createElement("lively-connector")
    connector.setAttribute("data-lively4-donotpersist", true)
    await lively.components.openIn(document.body, connector)
    this.connectionLine = connector
    
    connector.connectFrom(from)
    connector.connectTo(to)
    return connector
  }
  
  async removeConnectionLine() {
    if (this.connectionLine) this.connectionLine.remove()
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
    let newConnection = new Connection(
      this.source, this.sourceProperty, 
      this.target, this._targetProperty, 
      this.isEvent);
    newConnection.setModifyingCode(this.modifyingCode);
    newConnection.activate();
    return newConnection;
  }
  
  deactivate() {
    this.ae && this.ae.dispose()
    if(this.isEvent){
      lively.removeEventListener ('Connections', this.source, this.trackingCode, this._eventListener)
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
  
  setSource(object) {
    this.source = object
  }
  
  getSourceId() {
    return this.sourceId
  }
  
  getTarget() {
    return this.target
  }
  
  setTarget(object) {
    this.target = object
  }
  
  getTargetId() {
    return this.targetId
  }
  
  getAexpr() {
    return this.ae
  }
  
  getSourceProperty() {
    return this._sourceProperty
  }
  
  setSourceProperty(newProperty) {
    this._sourceProperty = newProperty;
    this.saveSerializedConnectionIntoWidget();
    this.activate();
  }
  
  getModifyingCode() {
    return this.modifyingCode
  }
  
  setModifyingCode(string) {
    this.modifyingCode = string;
    this.saveSerializedConnectionIntoWidget();
  }
  
  static get allConnections() {
    return window.allConnections
  }
  
  static allConnectionsFor(object) {
    let connections = [];
    if (object.hasAttribute && object.hasAttribute('data-lively-id')) {
      let objectId = object.getAttribute('data-lively-id');
      this.allConnections.forEach(connection => {
        if((connection.targetId == objectId) || (connection.sourceId == objectId)) {connections.push(connection)}
      })
    }
    return connections
  }
  
  getLabel() {
    return this._sourceProperty + "⇨" + this._targetProperty 
  }
  
  setLabel(string) {
    this.label = string // not used...
  }
  
}

window.allConnections.forEach(connection => connection.migrateTo(Connection));