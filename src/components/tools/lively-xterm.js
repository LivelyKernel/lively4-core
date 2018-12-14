import Terminal from "src/external/xterm.js/xterm.js"
import ContextMenu from 'src/client/contextmenu.js';
import {attach} from "src/external/xterm.js/addons/attach.js"
import * as fit from "src/external/xterm.js/addons/fit.js"

import Morph from 'src/components/widgets/lively-morph.js';

/*
  lively.preferences.set("PiTerminalURL", "https://lively-kernel.org/boardpi_term/")
*/

/* Apache Config for Terminal Proxy (https + wss)

  ProxyPass               /boardpi_term/terminal ws://localhost:8008/terminal
  ProxyPassReverse        /boardpi_term/terminal ws://localhost:8008/terminal
  ProxyPass               /boardpi_term http://localhost:8008
  ProxyPassReverse        /boardpi_term http://localhost:8008
  <Proxy http://localhost:8008/*>
          Allow from all
  </Proxy>
*/


import {debounce} from "utils"

export default class LivelyXterm extends Morph {
  async initialize() {
    this.windowTitle = "Lively XTerm.js";
    
    this.setup()
  }
  
  async setup(force) {
    lively.removeEventListener("xterm", this)
    lively.addEventListener("xterm", this, 'contextmenu',  evt => this.onContextMenu(evt), false);
    lively.addEventListener("xterm", this, 'extent-changed', debounce.call(evt => { this.onExtentChanged(evt); }, 500));
    if (!this.url) {
      this.url = lively.preferences.get("PiTerminalURL")
    }
    await this.open()
    if (force || !this.session) {
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
            ["change terminal url", () => this.changeTerminalURL()],
          ]);
      menu.openIn(document.body, evt, this);
      return true;
    }    
  }
  
  async reconnect() {
    await this.newSession()
    await this.connectSession()
  }

  async changeTerminalURL() {
    var defaultValue = lively.preferences.get("PiTerminalURL") || "http://localhost:3000/"
    var newValue = await lively.prompt("set new PiTerminal URL", defaultValue)
    if (newValue) {
      lively.preferences.set("PiTerminalURL", newValue)
      this.url = newValue
      lively.notify("new termianl url: " + newValue)
      
      await this.setup(true)
      this.term.focus()
    }
  }

  
  get url() {
    return this.getAttribute("url")
  }
  
  set url(s) {
    return this.setAttribute("url", s)
  }

  get session() {
    return this.getAttribute("session")
  }
  
  set session(s) {
    return this.setAttribute("session", s)
  }
  
  async open() {
    var container = this.get("#container")
    container.innerHTML = ""
    this.term = new Terminal();
    this.term.open(container)
    
    fit.apply(Terminal)
    // Terminal.applyAddon(fit);  // Apply the `fit` addon
    this.term.fit()
  }

  async newSession() {
    var session  = await fetch(`${this.url.replace(/\/$/,"")}/create?cols=88&rows=24`, {
      method: "POST", 
      headers: {
      }
    }).then(r => r.text()) 
    
    if (parseInt(session) > 0) {
      this.session = session
    } else {
      lively.warn("could not get session, because " + session)
    }
    
  }
  
  async connectSession() {
    var baseWebSocketURL = this.url.replace(/http/,"ws")
    var socketURL = `${baseWebSocketURL.replace(/\/$/,"")}/terminal/${this.session}`
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