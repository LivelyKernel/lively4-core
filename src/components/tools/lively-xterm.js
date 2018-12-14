import Terminal from "src/external/xterm.js/xterm.js"
import ContextMenu from 'src/client/contextmenu.js';
import {attach} from "src/external/xterm.js/addons/attach.js"
import * as fit from "src/external/xterm.js/addons/fit.js"

import Morph from 'src/components/widgets/lively-morph.js';

/*
  #TODO write UI for this:
  
  lively.preferences.set("PiTerminalHost", "172.21.13.255")
  lively.preferences.set("PiTerminalPort", "3000")

*/


import {debounce} from "utils"

export default class LivelyXterm extends Morph {
  async initialize() {
    this.windowTitle = "Lively XTerm.js";
    
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
    this.addEventListener('extent-changed', debounce.call(evt => { this.onExtentChanged(evt); }, 500));
    
    this.host = lively.preferences.get("PiTerminalHost")
    this.port = lively.preferences.get("PiTerminalPort")
    await this.open()
    if (!this.session) {
      await this.newSession()
    }
    await this.connectSession()
    
  }
  
  onContextMenu(evt) {
    if (this.lastPointerUp && (Date.now() - this.lastPointerUp < 1000)) {
      evt.stopPropagation();
      evt.preventDefault();
      return; // #HACK custom prevent default....
    }

    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();

      var menu = new ContextMenu(this, [
            ["reconnect", () => this.reconnect()],
            ["python shell", () => this.startPython()],
          ]);
      menu.openIn(document.body, evt, this);
      return true;
    }    
  }
  
  async reconnect() {
    await this.newSession()
    await this.connectSession()
  }
  
  get host() {
    return this.getAttribute("host")
  }
  
  set host(s) {
    return this.setAttribute("host", s)
  }
  
  get port() {
    return this.getAttribute("port")
  }
  
  set port(s) {
    return this.setAttribute("port", s)
  }

  get session() {
    return this.getAttribute("session")
  }
  
  set session(s) {
    return this.setAttribute("session", s)
  }
  
  async open() {
    var container = this.get("#container")
    this.term = new Terminal();
    this.term.open(container)
    
    fit.apply(Terminal)
    // Terminal.applyAddon(fit);  // Apply the `fit` addon
    this.term.fit()
  }

  async newSession() {
    // this.session  = await fetch(`http://${this.host}:${this.port}/terminals?cols=88&rows=24`, {
    
    // this.session  = await fetch(`https://lively-kernel.org/boardpi_term/create?cols=88&rows=24`, {
    this.session  = await fetch(`https://lively-kernel.org/sensorpi_term/create?cols=88&rows=24`, {
      method: "POST", 
      headers: {
      }
    }).then(r => r.text()) 
  }
  
  async connectSession() {
    //var socketURL = `ws://${this.host}:${this.port}/terminals/${this.session}`
    
    var socketURL = `wss://lively-kernel.org/sensorpi_termWS/terminal/${this.session}`
    // var socketURL = `wss://lively-kernel.org/boardpi_termWS/terminal/${this.session}`
    this.socket = new WebSocket(socketURL)
    attach(this.term, this.socket, true)
  }
    
  
  startPython() {
    this.parentElement.setAttribute("title", "Python")
    this.classList.add("python")
    this.term.__sendData(`python\n`)
  }
  
  
  livelyMigrate(other) {
    
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  livelyPrepareSave() {
    
  } 
  
  onExtentChanged() {
    if (this.term) {
      this.term.fit()
    }
  }
  
  async livelyExample() {
  
  }
}