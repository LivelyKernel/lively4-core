"enable aexpr";
import {pt} from 'src/client/graphics.js';
//import {uuid} from 'utils';

const allConnections = new Set()

export default class Connection {
  
  static nextId(){
    this._currentId = this._currentId || 1
    return this._currentId++
  }
  
  constructor(target, targetProperty, source, sourceProperty, isEvent) {
    this.id = Connection.nextId();
    allConnections.add(this);
    
    this.target = target;
    this.targetProperty = targetProperty;
    this.source = source;
    this.sourceProperty = sourceProperty;
    this.isEvent = isEvent;
  }
  
  activateConnection(){
    if(this.isEvent){
      this.activateEventConnection()
    }
    else {
      this.activateAexprConnection()
    }    
  }
  
  activateEventConnection(){
    this.source.addEventListener('click', () => this.target.style.width = this.target.style.width*2+"pt")
  }
  
  activateAexprConnection(){
    this.ae = aexpr(() => this.source[this.sourceProperty]);
    this.ae.onChange(svalue => this.target.style[this.targetProperty]= svalue + "pt");
  }
  
  drawConnectionLine(){
    let line = [lively.getGlobalPosition(this.source), lively.getGlobalPosition(this.target)];
    lively.showPath(line, "rgba(80,180,80,1)", true);
  }
  
  removeAexpr(){
    this.ae.dispose()
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
  
  static get allConnections(){
    return allConnections
  }
  
  connectionString(){
    return 'Connection ' + this.id
  }
}

// #UPDATE_INSTANCES
// #TODO: idea: using a list of all object, we can make them become anew
// go through all object reachable from window
allConnections.forEach(connection => {
    // evil live programming
    connection.constructor === Connection

    // we can fix this, so we can do live development again....
    connection.__proto__ = Connection.prototype
  });