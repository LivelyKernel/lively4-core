"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';
import {pt} from 'src/client/graphics.js';
import ContextMenu from "src/client/contextmenu.js";
import Connection from "./Connection.js";

export default class LivelyHaloConnectorsItem extends HaloItem {
  
  async initialize() {
    this.windowTitle = "LivelyHaloConnectorsItem";

    this.registerEvent('click', 'onClick');
  }
   
  onClick(evt) {
      this.source = window.that;
    
      this.showStartingConnectorsMenuFor(evt);
    
      this.hideHalo();
  }
  
  async showMenu(evt, menuItems) {
    const menu = await ContextMenu.openIn(document.body, evt, undefined, document.body, menuItems);
  }
  
  async showStartingConnectorsMenuFor(evt) {  
    
    let connections = []
    Connection.allConnections.forEach(connection => {
      connections.push(connection)
    })
    let existingConnectionsMenu = connections.map(connection => [connection.getLabel(), () => this.openConnectionEditor(connection)]);
    let myConnectionsMenu = Connection.allConnectionsFor(this.source).map(connection => [connection.getLabel(), () => this.openConnectionEditor(connection)]);
    
    const menuItems = [
      ['Value', () => this.startCreatingConnectionFor(evt, 'value', false)],
      ['Width', () => this.startCreatingConnectionFor(evt, 'style.width', false)],
      ['Height', () => this.startCreatingConnectionFor(evt, 'style.height', false)],
      ['Events', this.getAllEventsFor(this.source, evt)],
      ['Style', this.getAllStylesFor(this.source, evt)],
      ['On custom...', () => this.startCreatingConnectionCustom(evt)],
      ['My Connections', myConnectionsMenu, '', '<i class="fa fa-arrow-right" aria-hidden="true"></i>'],
      ['All Connections', existingConnectionsMenu, '', '<i class="fa fa-arrow-right" aria-hidden="true"></i>']
    ];
    
    this.showMenu(evt, menuItems);
  }
  
  //More events https://developer.mozilla.org/en-US/docs/Web/Events
  getAllEventsFor(object, evt) {
    return [['Click', () => this.startCreatingConnectionFor(evt, 'click', true)],
      ['DoubleClick', () => this.startCreatingConnectionFor(evt, 'dblclick', true)],
      ['MouseDown', () => this.startCreatingConnectionFor(evt, 'mousedown', true)],
      ['MouseEnter', () => this.startCreatingConnectionFor(evt, 'mouseenter', true)],
      ['MouseLeave', () => this.startCreatingConnectionFor(evt, 'mouseleave', true)],
      ['MouseMove', () => this.startCreatingConnectionFor(evt, 'mousemove', true)],
      ['MouseOver', () => this.startCreatingConnectionFor(evt, 'mouseover', true)],
      ['MouseOut', () => this.startCreatingConnectionFor(evt, 'mouseout', true)],
      ['MouseUp', () => this.startCreatingConnectionFor(evt, 'mouseup', true)]]
  }
  
  getAllStylesFor(object, evt, isFinishing = false) {
    let result = [];
    let styles = window.getComputedStyle(object);
    let stylesLength = styles.length;
    for(let i = 0; i < stylesLength; i++){
      if(isFinishing){
        result.push([styles.item(i), event => this.finishCreatingConnection(object, 'style.' + styles.item(i), event)]);
      } else {
        result.push([styles.item(i), () => this.startCreatingConnectionFor(evt, 'style.' + styles.item(i), false)]); 
      }
    }
    return result;
  }
  
  async showFinishingConnectorsMenuFor(evt, morph) {
    const menuItems = [
      ['Value', event => this.finishCreatingConnection(morph, 'value', event)],
      ['Width', event => this.finishCreatingConnection(morph, 'style.width', event)],
      ['Height', event => this.finishCreatingConnection(morph, 'style.height', event)],
      ['InnerHTML', event => this.finishCreatingConnection(morph, 'innerHTML', event)],
      // Hook for chained events
      //['Events', this.getAllEventsFor(morph, evt, true)],
      ['Style', this.getAllStylesFor(morph, evt, true)],
      ['On custom...', event => this.finishCreatingConnectionCustom(morph, event)]];
    this.showMenu(evt, menuItems);
  }
  
  elementUnderHand(evt) {
    var path = evt.composedPath().slice(evt.composedPath().indexOf(evt.srcElement))
    return path[0]
  }
  
  onPointerMove(evt) {
    if (this.dropIndicator) this.dropIndicator.remove()
    this.dropTarget = this.elementUnderHand(evt)
    if (this.dropTarget) {
      this.dropIndicator = lively.showElement(this.dropTarget)
      this.dropIndicator.style.border = "3px dashed rgba(0,100,0,0.5)"
      this.dropIndicator.innerHTML = ""
    }
    
    if (this.valueIndicator) this.valueIndicator.remove();
    this.valueIndicator = <span>{this.sourceProperty}</span>;
    this.valueIndicator.style.zIndex = 200;
    lively.setGlobalPosition(this.valueIndicator, pt(lively.getPosition(evt).x+1, lively.getPosition(evt).y+1));
    document.body.appendChild(this.valueIndicator);
  }
  
  onPointerUp(evt) {
    lively.removeEventListener("Connectors")
    
    if (this.dropIndicator) this.dropIndicator.remove()
    if (this.valueIndicator) this.valueIndicator.remove()
    var morph = this.elementUnderHand(evt)
    
    this.showFinishingConnectorsMenuFor(evt, morph);
  }
  
  async openConnectionEditor(connection) {
    let editor = await lively.openComponentInWindow('lively-connection-editor')
    editor.setConnection(connection)
  }
  
  async startCreatingConnectionCustom(evt) {
    var userinput = await lively.prompt("Enter something", "value");
    this.startCreatingConnectionFor(evt, userinput, false);
  }
  
  startCreatingConnectionFor(evt, property, isEvent) {
    this.sourceProperty = property;
    this.isEvent = isEvent;
    
    lively.addEventListener("Connectors", document.body.parentElement, "pointermove",
      e => this.onPointerMove(e), { capture: true });
    lively.addEventListener("Connectors", document.body.parentElement, "pointerup",
      e => this.onPointerUp(e), { capture: true });
  }
  
  async finishCreatingConnectionCustom(target, event) {
    var userinput = await lively.prompt("Enter something", "style.width");
    this.finishCreatingConnection(target, userinput, event);
  }
  
  finishCreatingConnection(target, targetProperty, event) {
    let connection = new Connection(target, targetProperty, this.source, this.sourceProperty, this.isEvent);
    connection.activate();
    connection.drawConnectionLine();
    if(!event.shiftKey){
      this.openConnectionEditor(connection);
    }
  } 
}