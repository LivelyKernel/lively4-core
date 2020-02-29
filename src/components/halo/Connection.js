"enable aexpr";

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
    this._sourceProperty = sourceProperty;
    this.isEvent = isEvent;
    this.isActive = false
    this._eventListener = evt => this.connectionFunction(evt)
    this._targetProperty = this.cleanProperty(this._targetProperty)
    if(isEvent){
      this.valueModifyingCode = "(target, event) => {target." + this._targetProperty + " = 42}";
      this.trackingCode = this._sourceProperty;
    } else {
      this.valueModifyingCode = "(target, sourceValue) => {target." + this._targetProperty + " = sourceValue}";
      this._sourceProperty = this.cleanProperty(this._sourceProperty)
      this.trackingCode = `(source) => {
  return source.${this._sourceProperty};
}`
    }
    
    this.label = 'Connection ' + this.id
    this.makeSavingScript();
  }
  
  cleanProperty(property) {
    if(property.includes('.')) {
      return property.split(".").map(each => this.camelCaseIfNeeded(each)).join(".")
    } else {
      return property
    }
  }
  
  camelCaseIfNeeded(propertyPart) {
    if(propertyPart.includes('-')) {
      return propertyPart.camelCase();
    } else {
      return propertyPart;
    }
  }
  
  makeSavingScript() {
    this.targetId = lively.ensureID(this.target);
    this.sourceId = lively.ensureID(this.source);
    this.saveSerializedConnectionIntoWidget();
  }
  
  saveSerializedConnectionIntoWidget() {
    const serializedConnections = Array.from(window.allConnections)
      .filter(connection => connection.source === this.source)
      .map(connection => connection.serialize())
    this.source.setJSONAttribute('data-connection', serializedConnections);
  }
  
  serialize() {
    return {
      sourceId: this.sourceId,
      targetId: this.targetId,
      trackingCode: this.trackingCode,
      modifyingcode: this.valueModifyingCode,
      label: this.label,
      isEvent: this.isEvent
    }
  }
  
  static deserialize(json) {
    json.forEach(connectionData => {
      this.connectionFromExistingData(connectionData.targetId, connectionData.modifyingcode, connectionData.sourceId, connectionData.trackingCode, connectionData.label, connectionData.isEvent)
    })
  }
  
  static deserializeFromObjectIfNeeded(object) {
    if (object.hasAttribute && object.hasAttribute('data-connection')) {
      this.deserialize(object.getJSONAttribute('data-connection'))
    }
  }
  
  static connectionFromExistingData(targetId, modifyingCode, sourceId, trackingCode, label, isEvent) {
    const target = lively.elementByID(targetId);
    const source = lively.elementByID(sourceId);
    const undeadConnection = new Connection(target, 'something', source, 'something', isEvent);
    undeadConnection.setModifyingCode(modifyingCode);
    undeadConnection.setTrackingCode(trackingCode);
    undeadConnection.setLabel(label);
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
    lively.notify(this.trackingCode)
    lively.addEventListener('Connections', this.source, this.trackingCode, this._eventListener);
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
    let myFunction = await this.valueModifyingCode.boundEval()
    myFunction(this.target, sourceValue)
  }
  
  drawConnectionLine() {
    let line = [lively.getGlobalCenter(this.source), lively.getGlobalCenter(this.target)];
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
    newConnection.setModifyingCode(this.valueModifyingCode);
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
    return this.sourceProperty
  }
  
  setSourceProperty(newProperty) {
    this.sourceProperty = newProperty;
    this.saveSerializedConnectionIntoWidget();
    this.activate();
  }
  
  getModifyingCode() {
    return this.valueModifyingCode
  }
  
  setModifyingCode(string) {
    this.valueModifyingCode = string;
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
    return this.label
  }
  
  setLabel(string) {
    this.label = string
  }
  
}

window.allConnections.forEach(connection => connection.migrateTo(Connection));