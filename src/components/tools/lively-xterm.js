import Terminal from "src/external/xterm.js/xterm.js"
import ContextMenu from 'src/client/contextmenu.js';
import {attach} from "src/external/xterm.js/addons/attach.js"
import * as fit from "src/external/xterm.js/addons/fit.js"

import Morph from 'src/components/widgets/lively-morph.js';

/*
  Terminal now uses lively4-server integrated terminal service
  Requires GitHub authentication instead of simple secret-based auth
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
    
    // Use current lively4-server base URL instead of external service
    if (!this.url) {
      this.url = lively4url
    }
    
    if (!this.cwd) {
      this.cwd = lively.preferences.get("TerminalCWD")
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
            ["change terminal working directory", () => this.changeTerminalCWD()],
            ["resize terminal", () => this.resizeTerminal()],
          ]);
      menu.openIn(document.body, evt, this);
      return true;
    }    
  }
  
  async reconnect() {
    this.setup(true)
  }

  async resizeTerminal() {
    if (!this.session) {
      lively.warn("No active terminal session")
      return
    }
    
    var cols = await lively.prompt("Terminal columns", "80")
    var rows = await lively.prompt("Terminal rows", "24")
    
    if (cols && rows) {
      try {
        // Extract server base URL without repository path
        var serverBaseURL = this.url.replace(/\/[^\/]*$/, "")
        await fetch(`${serverBaseURL}/_terminal/size/${this.session}?cols=${cols}&rows=${rows}`, {
          method: "POST"
          // No headers needed - session cookie automatically sent
        })
        
        // Also resize the xterm.js terminal
        this.term.resize(parseInt(cols), parseInt(rows))
        lively.notify(`Terminal resized to ${cols}x${rows}`)
      } catch (error) {
        lively.warn("Failed to resize terminal: " + error.message)
      }
    }
  }
  
  
  async changeTerminalCWD() {
    var defaultValue = lively.preferences.get("TerminalCWD")
    var newValue = await lively.prompt("set new Terminal working directory", defaultValue)
    if (newValue) {
      lively.preferences.set("TerminalCWD", newValue)
      this.cwd = newValue
      lively.notify("new terminal cwd: " + newValue)
      
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

  get cwd() {
    return this.getAttribute("cwd")
  }
  
  set cwd(s) {
    return this.setAttribute("cwd", s)
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

  async getAuthHeaders() {
    // Use lively4-server's GitHub authentication - same pattern as lively-sync.js
    const username = this.get("#gitusername") ? this.get("#gitusername").value : await this.loadValue("githubUsername")
    const token = await this.loadValue("githubToken")
    
    return {
      gitusername: username,
      gitpassword: token,
      cwd: this.cwd
    }
  }

  get storagePrefix() {
    return "LivelySync_"
  }
  
  async loadValue(key) {
    return lively.focalStorage.getItem(this.storagePrefix + key)
  }

  async storeValue(key, value) {
    return lively.focalStorage.setItem(this.storagePrefix + key, value)
  }

  async ensureAuthenticated() {
    try {
      // First check if we have cached credentials
      var auth = await this.getAuthHeaders()
      
      if (!auth.gitusername || !auth.gitpassword) {
        // Use the same GitHub auth flow as lively-sync
        const token = await new Promise((resolve, reject) => {
          lively.authGithub.challengeForAuth(Date.now(), async (token) => {
            try {
              // Get user info from GitHub API
              const userResponse = await fetch("https://api.github.com/user", {
                headers: { Authorization: "token " + token }
              })
              const user = await userResponse.json()
              const username = user.login
              
              // Store credentials using same pattern as lively-sync
              await this.storeValue("githubUsername", username)
              await this.storeValue("githubToken", token)
              
              lively.notify("GitHub authentication successful")
              resolve(token)
              
            } catch (error) {
              reject(error)
            }
          })
        })
        
        // Update auth with new credentials
        auth = await this.getAuthHeaders()
      }
      
      if (!auth.gitusername || !auth.gitpassword) {
        lively.warn("Authentication cancelled or failed")
        return false
      }
      
      // Extract server base URL without repository path  
      var serverBaseURL = this.url.replace(/\/[^\/]*$/, "")
      const loginURL = `${serverBaseURL}/_auth/login`
      
      const loginResponse = await fetch(loginURL, {
        method: "POST",
        headers: {
          'gitusername': auth.gitusername,
          'gitpassword': auth.gitpassword
        }
      })
      
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text()
        lively.warn("Authentication failed: " + loginResponse.status + " - " + errorText)
        return false
      }
      
      return true
      
    } catch (error) {
      lively.warn("Authentication failed: " + error.message)
      return false
    }
  }

  async newSession() {
    try {
      // First ensure we're authenticated (this sets the session cookie)
      if (!(await this.ensureAuthenticated())) {
        return
      }
      
      var cols = this.term ? this.term.cols : 88
      var rows = this.term ? this.term.rows : 24
      
      // Extract server base URL without repository path  
      var serverBaseURL = this.url.replace(/\/[^\/]*$/, "")
      const createURL = `${serverBaseURL}/_terminal/create?cols=${cols}&rows=${rows}`
      
      // No headers needed - session cookie will be sent automatically
      const response = await fetch(createURL, {
        method: "POST"
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        lively.warn("Server error creating terminal: " + response.status + " - " + errorText)
        return
      }
      
      var session = await response.text()
      
      if (parseInt(session) > 0) {
        this.session = session
      } else {
        lively.warn("could not get session, because " + session)
      }
    } catch (error) {
      lively.warn("Failed to create terminal session: " + error.message)
    }
  }
  
  async connectSession() {
    if (!this.session) {
      lively.warn("No terminal session available to connect")
      return
    }
    
    try {
      // Extract server base URL without repository path
      var serverBaseURL = this.url.replace(/\/[^\/]*$/, "")
      var baseWebSocketURL = serverBaseURL.replace(/^http/, "ws")
      var socketURL = `${baseWebSocketURL}/_terminal/ws/${this.session}`
      
      // ✅ Simple WebSocket connection - session cookie automatically sent by browser
      this.socket = new WebSocket(socketURL)
      
      this.socket.addEventListener('open', () => {
        lively.notify("Terminal connected")
      })
      
      this.socket.addEventListener('error', (error) => {
        lively.warn("WebSocket connection error")
      })
      
      this.socket.addEventListener('close', (event) => {
        lively.notify("Terminal connection closed")
      })
      
      attach(this.term, this.socket, true)
      
    } catch (error) {
      lively.warn("Failed to connect to terminal: " + error.message)
    }
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