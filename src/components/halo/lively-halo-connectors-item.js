"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';
import {pt} from 'src/client/graphics.js';
import ContextMenu from "src/client/contextmenu.js";
import Connection from "./Connection.js";
import { domEvents, cssProperties } from "src/client/constants.js";


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
  
  attachedCallback() {
  }
  
  detachedCallback() {
  
  }

  async showMenu(evt, menuItems) {
    return ContextMenu.openIn(document.body, evt, undefined, document.body, menuItems);
  }
  
  async showStartingConnectorsMenuFor(evt) {  
    
    let myConnectionsMenu = Connection.allConnectionsFor(this.source)
        .map(connection => [
          connection.getLabel(), 
          () => this.openConnectionEditor(connection)]);
    
    const menuItems = [
      ['Value', () => this.startCreatingConnectionFor(evt, 'value', false)],
      ['Width', () => this.startCreatingConnectionFor(evt, 'style.width', false)],
      ['Height', () => this.startCreatingConnectionFor(evt, 'style.height', false)],
      ['Events', this.getAllEventsFor(this.source, evt)],
      ['Style', this.getAllStylesFor(this.source, evt)],
      ['On custom...', () => this.startCreatingConnectionCustom(evt)],
      ['Connections', myConnectionsMenu, '', '<i class="fa fa-arrow-right" aria-hidden="true"></i>'],
    ];
    
    return this.showMenu(evt, menuItems);
  }
  
  //More events https://developer.mozilla.org/en-US/docs/Web/Events
  getAllEventsFor(object, evt) {
    const allEvents = domEvents.map(domEvent => [domEvent, () => this.startCreatingConnectionFor(evt, domEvent, true)]);
    
    return [
      ['click', () => this.startCreatingConnectionFor(evt, 'click', true)],
      ['dblclick', () => this.startCreatingConnectionFor(evt, 'dblclick', true)],
      ['mousemove', () => this.startCreatingConnectionFor(evt, 'mousemove', true)],
      ['more', allEvents]
    ];
  }
  
  getAllStylesFor(object, evt, isFinishing = false) {
    const result = [];
    
    cssProperties.forEach(cssProperty => {
      if(isFinishing){
        result.push([cssProperty, event => this.finishCreatingConnection(object, 'style.' + cssProperty, event)]);
      } else {
        result.push([cssProperty, () => this.startCreatingConnectionFor(evt, 'style.' + cssProperty, false)]); 
      }
    });

    return result;
  }
  
  async showFinishingConnectorsMenuFor(evt, morph) {
    const menuItems = [
      ['Value', event => this.finishCreatingConnection(morph, 'value', event)],
      ['Width', event => this.finishCreatingConnection(morph, 'style.width', event)],
      ['Height', event => this.finishCreatingConnection(morph, 'style.height', event)],
      ['innerHTML', event => this.finishCreatingConnection(morph, 'innerHTML', event)],
      // Hook for chained events
      //['Events', this.getAllEventsFor(morph, evt, true)],
      ['Style', this.getAllStylesFor(morph, evt, true)],
      ['On custom...', event => this.finishCreatingConnectionCustom(morph, event)]];
    return await this.showMenu(evt, menuItems);
  }
  
  elementUnderHand(evt) {
    return lively.hand.elementUnderHand(evt)
  }
  
  onPointerMove(evt) {
    if (this.dropIndicator) this.dropIndicator.remove()
    this.dropTarget = this.elementUnderHand(evt)
    if (this.dropTarget) {
      this.dropIndicator = lively.showElement(this.dropTarget)
      this.dropIndicator.style.border = "3px dashed rgba(0,100,0,0.5)"
      this.dropIndicator.innerHTML = ""
    }
    
    if (this.valueIndicator) {
      this.valueIndicator.remove();
    }
    this.valueIndicator = <span>{this.sourceProperty}</span>;
    this.valueIndicator.isMetaNode = true
    this.valueIndicator.style.zIndex = 200;
    document.body.appendChild(this.valueIndicator);
    lively.setClientPosition(this.valueIndicator, pt(lively.getPosition(evt).x+1, lively.getPosition(evt).y+1));
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
    lively.setExtent(editor.parentElement, lively.pt(800, 50))
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
    let connection = new Connection(this.source, this.sourceProperty, 
                                    target, targetProperty, this.isEvent);
    connection.activate();
    connection.drawConnectionLine();
    if(!event.shiftKey){
      this.openConnectionEditor(connection);
    }
  } 
}