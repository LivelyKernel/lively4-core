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
    
    // css styles, attributes, properties, and methods
    const menuItems = [
      ...this.eventMenu(this.source, evt),
      '---',
      ...this.stateMenu(this.source, evt),
      ['custom', () => this.startCreatingConnectionCustom(evt), undefined, this.fa4('cogs')],
      '---',
      ['connections', myConnectionsMenu, '', '<i class="fa fa-arrow-right" aria-hidden="true"></i>'],
    ];
    
    return this.showMenu(evt, menuItems);
  }
  
  fa4(iconName) {
    return `<i class="fa fa-${iconName}" aria-hidden="true"></i>`
  }
  
  //More events https://developer.mozilla.org/en-US/docs/Web/Events
  eventMenu(object, evt) {
    const allEvents = domEvents.map(domEvent => [domEvent, () => this.startCreatingConnectionFor(evt, domEvent, true)]);
    
    return [
      ['click', () => this.startCreatingConnectionFor(evt, 'click', true), undefined, this.fa4('mouse-pointer')],
      ['double click', () => this.startCreatingConnectionFor(evt, 'dblclick', true), undefined, this.fa4('mouse-pointer')],
      ['mousemove', () => this.startCreatingConnectionFor(evt, 'mousemove', true), undefined, this.fa4('arrows')],
      ['events', allEvents, undefined, this.fa4('bars')]
    ];
  }
  
  stateMenu(object, evt) {
    return [
      ['width', () => this.startCreatingConnectionFor(evt, 'style.width', false), undefined, this.fa4('arrows-h')],
      ['height', () => this.startCreatingConnectionFor(evt, 'style.height', false), undefined, this.fa4('arrows-v')],
      ['value', () => this.startCreatingConnectionFor(evt, 'value', false), undefined, this.fa4('check-square')],
      ['innerHTML', () => this.startCreatingConnectionFor(evt, 'innerHTML', false), undefined, this.fa4('font')],
      ['styles', this.getAllStylesFor(this.source, evt), undefined, this.fa4('bars')],
      ['attributes', this.getAllAttributesFor(this.source, evt), undefined, this.fa4('bars')],
      ['properties', this.getAllPropertiesFor(this.source, evt), undefined, this.fa4('bars')],
      ['methods', this.getAllMethodsFor(this.source, evt), undefined, this.fa4('bars')],
    ];
  }
  
  getAllAttributesFor(object, evt, isFinishing = false) {
    return [];
  }
  
  getAllPropertiesFor(object, evt, isFinishing = false) {
    return Object.keys(object).map(name => {
      if(isFinishing){
        return [name, event => this.finishCreatingConnection(object, name, event)];
      } else {
        return [name, () => this.startCreatingConnectionFor(evt, name, false)];
      }
    });
  }
  
  // #TODO: what about getter and setter?
  getAllMethodsFor(object, evt, isFinishing = false) {
    return [];
  }
  
  getAllStylesFor(object, evt, isFinishing = false) {
    return cssProperties.map(cssProperty => {
      if(isFinishing){
        return [cssProperty, event => this.finishCreatingConnection(object, 'style.' + cssProperty, event)];
      } else {
        return [cssProperty, () => this.startCreatingConnectionFor(evt, 'style.' + cssProperty, false)];
      }
    });
  }
  
  async showFinishingConnectorsMenuFor(evt, morph) {
    const menuItems = [
      // #TODO Hook for chained events
      //['Events', this.eventMenu(morph, evt, true)],
      '---',
      ['width', event => this.finishCreatingConnection(morph, 'style.width', event), undefined, this.fa4('arrows-h')],
      ['height', event => this.finishCreatingConnection(morph, 'style.height', event), undefined, this.fa4('arrows-v')],
      ['value', event => this.finishCreatingConnection(morph, 'value', event), undefined, this.fa4('check-square')],
      ['innerHTML', event => this.finishCreatingConnection(morph, 'innerHTML', event), undefined, this.fa4('font')],
      ['styles', this.getAllStylesFor(this.source, evt, true), undefined, this.fa4('bars')],
      ['attributes', this.getAllAttributesFor(this.source, evt, true), undefined, this.fa4('bars')],
      ['properties', this.getAllPropertiesFor(this.source, evt, true), undefined, this.fa4('bars')],
      ['methods', this.getAllMethodsFor(this.source, evt, true), undefined, this.fa4('bars')],
      '---',
      ['custom', event => this.finishCreatingConnectionCustom(morph, event)]
    ];
    
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
      this.dropIndicator.style.border = ""
      this.dropIndicator.style.outline = "3px dashed rgba(0,100,0,0.5)"
      this.dropIndicator.style.pointerEvents = 'none'
      this.dropIndicator.innerHTML = ""
    }
    
    if (this.valueIndicator) {
      this.valueIndicator.remove();
    }
    this.valueIndicator = <span>{this.sourceProperty}</span>;
    this.valueIndicator.isMetaNode = true
    this.valueIndicator.style.zIndex = 200;
    this.valueIndicator.style.pointerEvents = 'none'
    document.body.appendChild(this.valueIndicator);
    lively.setClientPosition(this.valueIndicator, lively.getPosition(evt).addXY(5, -10));
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