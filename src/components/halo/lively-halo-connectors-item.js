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
  
  async showMenu(evt, menuItems){
    const menu = await ContextMenu.openIn(document.body, evt, undefined, document.body, menuItems);
  }
  
  async showStartingConnectorsMenuFor(evt) {  
    
    let connections = []
    Connection.allConnections.forEach(connection => {
      connections.push(connection)
    })
    let existingConnectionsMenu = connections.map(connection => [connection.connectionString(), () => this.openConnectionEditor(connection)]);
    
    const menuItems = [[
      'Connections',
      existingConnectionsMenu,
      'Opens all created connections',
      '<i class="fa fa-arrow-right" aria-hidden="true"></i>'
      ], [
      'New Connection',
        [['On custom...', () => this.startCreatingConnectionCustom(evt)],
          ['On value', () => this.startCreatingConnectionFor(evt, 'value', false)],
         ['Click', () => this.startCreatingConnectionFor(evt, 'click', true)],
         ['Style', this.getAllStylesFor(this.source, evt)]],
      'Creates a new connection',
      '<i class="fa fa-image" aria-hidden="true"></i>'
    ]];
    
    this.showMenu(evt, menuItems);
  }
  
  getAllStylesFor(object, evt){
    let result = [];
    let styles = window.getComputedStyle(object);
    let stylesLength = styles.length;
    for(let i = 0; i < stylesLength; i++){
      result.push([styles.item(i), () => this.startCreatingConnectionFor(evt, styles.item(i), false)]);
    }
    return result;
  }
  
  mostImportantAttributes(){
    []
  }
  
  async showFinishingConnectorsMenuFor(evt, morph){
    const menuItems = [[
      'On custom...',
      () => this.finishCreatingConnectionCustom(morph)
    ],[
      'On width',
      () => this.finishCreatingConnection(morph, 'width')
    ],[
      'On height',
      () => this.finishCreatingConnection(morph, 'height')
    ]];
    
    this.showMenu(evt, menuItems);
  }
  
  elementUnderHand(evt) {
    var path = evt.composedPath().slice(evt.composedPath().indexOf(evt.srcElement))
    return path[0]
  }
  
  onPointerMove(evt) {
    //lively.showPoint(pt(evt.clientX, evt.clientY))
    //lively.notify('move')
    
    if (this.dropIndicator) this.dropIndicator.remove()
    this.dropTarget = this.elementUnderHand(evt)
    if (this.dropTarget) {
      this.dropIndicator = lively.showElement(this.dropTarget)
      this.dropIndicator.style.border = "3px dashed rgba(0,100,0,0.5)"
      this.dropIndicator.innerHTML = ""
    }
  }
  
  onPointerUp(evt) {
    //lively.notify('up')
    lively.removeEventListener("Connectors")
    
    if (this.dropIndicator) this.dropIndicator.remove()
    var morph = this.elementUnderHand(evt)
    
    this.showFinishingConnectorsMenuFor(evt, morph);
  }
  
   async openConnectionEditor(connection){
    let editor = await lively.openComponentInWindow('lively-connection-editor')
    editor.setConnection(connection)
  }
  
  async startCreatingConnectionCustom(evt){
    var userinput = await lively.prompt("Enter something", "value");
    this.startCreatingConnectionFor(evt, userinput, false);
  }
  
  startCreatingConnectionFor(evt, property, isEvent){
    this.sourceProperty = property;
    this.isEvent = isEvent;
    
        lively.addEventListener("Connectors", document.body.parentElement, "pointermove",
      e => this.onPointerMove(e), { capture: true });
    lively.addEventListener("Connectors", document.body.parentElement, "pointerup",
      e => this.onPointerUp(e), { capture: true });
  }
  
  async finishCreatingConnectionCustom(target){
    var userinput = await lively.prompt("Enter something", "width");
    this.finishCreatingConnection(target, userinput);
  }
  
  finishCreatingConnection(target, targetProperty){
    
    if(this.isEvent){
      return this.clickExample(target);
    }
    
    let connection = new Connection(target, targetProperty, this.source, this.sourceProperty, this.isEvent);
    connection.activate();
    connection.drawConnectionLine();
  } 
  
  clickExample(target){
    this.source.addEventListener('click', () => target.style.width = 42+"pt")
  }
  
  //TODO DELETE
  //let ae = aexpr(() => code.boundEval(sourceObject));
  //ae.onChange(svalue => target.style.width= svalue+"pt");
  /*
  let foo = '"width"'
  var code = `1+3`
  code.boundEval()
  */
}