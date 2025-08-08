import {Terminal} from "src/external/xterm.js/xterm.js"
import {FitAddon} from "src/external/xterm.js/addons/addon-fit.js"
import {AttachAddon} from "src/external/xterm.js/addons/addon-attach.js"
import ContextMenu from 'src/client/contextmenu.js';
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
    
    this.addEventListener('extent-changed', evt => this.onResize(evt));
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

    // Check if there's selected text - if so, add copy option
    var hasSelection = this.term && this.term.hasSelection && this.term.hasSelection();
    var selectedText = hasSelection ? this.term.getSelection() : null;

    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();

      var menuItems = [
            ["reconnect", () => this.reconnect()],
            ["python shell", () => this.startPython()],
            ["change terminal working directory", () => this.changeTerminalCWD()],
          ];

      // Add copy option if text is selected
      if (hasSelection) {
        menuItems.unshift(["copy", () => this.copySelection()]);
      }

      var menu = new ContextMenu(this, menuItems);
      menu.openIn(document.body, evt, this);
      return true;
    }    
  }

  copySelection() {
    if (this.term && this.term.hasSelection && this.term.hasSelection()) {
      var selectedText = this.term.getSelection();
      navigator.clipboard.writeText(selectedText).then(() => {
        lively.notify("Copied to clipboard");
      }).catch(() => {
        lively.warn("Failed to copy to clipboard");
      });
    }
  }
  
  async reconnect() {
    this.setup(true)
  }

  
  async onResize() {
    if (!this.session || !this.term) {
      return
    }
    
    try {
      // First resize the xterm.js terminal to fit the container
      if (this.fitAddon) {
        this.fitAddon.fit()
      }
      
      // Force refresh to recalibrate mouse coordinates after resize
      setTimeout(() => {
        if (this.term) {
          this.term.refresh(0, this.term.rows - 1)
        }
      }, 50)
      
      // Get the actual terminal dimensions after fitting
      var cols = this.term.cols
      var rows = this.term.rows
      
      if (cols && rows) {
        // Extract server base URL without repository path
        var serverBaseURL = this.url.replace(/\/[^\/]*$/, "")
        await fetch(`${serverBaseURL}/_terminal/size/${this.session}?cols=${cols}&rows=${rows}`, {
          method: "POST"
          // No headers needed - session cookie automatically sent
        })
        
      }
    } catch (error) {
      // Silently fail - resize errors are not critical
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
    
    // Configure terminal with proper options for handling offsets
    this.term = new Terminal({
      // Enable proper mouse handling
      scrollback: 1000,
      cursorBlink: true,
      
      // Font settings for consistent character sizing
      fontFamily: 'Monaco, "Lucida Console", monospace',
      fontSize: 14,
      lineHeight: 1.0,
      
      // Selection styling
      theme: {
        selectionBackground: '#316AC5',
        selectionForeground: '#ffffff',
        selectionInactiveBackground: 'rgba(49, 106, 197, 0.3)'
      }
    });
    
    // Create and load the fit addon for newer xterm.js
    this.fitAddon = new FitAddon()
    this.term.loadAddon(this.fitAddon)
    
    this.term.open(container)
    
    // Use the new fit addon
    this.fitAddon.fit()
    
    // Force a refresh after fitting to ensure coordinate mapping is correct
    setTimeout(() => {
      if (this.term) {
        this.term.refresh(0, this.term.rows - 1)
      }
    }, 100)
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
      
      // Use the new AttachAddon instead of the old attach function
      this.attachAddon = new AttachAddon(this.socket)
      this.term.loadAddon(this.attachAddon)
      
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