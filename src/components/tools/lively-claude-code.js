import {Terminal} from "src/external/xterm.js/xterm.js"
import {FitAddon} from "src/external/xterm.js/addons/addon-fit.js"
import {AttachAddon} from "src/external/xterm.js/addons/addon-attach.js"
import ContextMenu from 'src/client/contextmenu.js';
import Morph from 'src/components/widgets/lively-morph.js';
import {AudioRecorder} from "src/client/audio.js"
import {Speech} from "src/client/openai.js"
import {debounce} from "utils"

/*
 * Claude Code Terminal with Push-to-Talk
 * Combines terminal functionality from lively-xterm with push-to-talk from openai-audio-chat
 * Provides enhanced interface for Claude Code interaction
 */

let CurrentClaudeCodeInstance

export default class LivelyClaudeCode extends Morph {
  
  static get current() {
    return CurrentClaudeCodeInstance
  }

  async initialize() {
    this.windowTitle = "Claude Code Terminal";
    
    // Initialize audio recorder for push-to-talk
    this.audioRecorder = new AudioRecorder();
    
    // Initialize UI references
    this.pushToTalkBtn = this.get("#pushToTalkBtn");
    this.enterBtn = this.get("#enterBtn");
    this.deleteBtn = this.get("#deleteBtn");
    this.statusIndicator = this.get("#statusIndicator");
    this.terminalContainer = this.get("#terminalContainer");
    
    // Initialize terminal color schemes (from lively-xterm)
    this.initializeColorSchemes();
    
    // Set up event listeners
    this.addEventListener('extent-changed', evt => this.onResize(evt));
    
    // Set up push-to-talk button with proper hold/release semantics
    if (this.pushToTalkBtn) {
      this.pushToTalkBtn.addEventListener('mousedown', async (evt) => {
        // Store whether Shift is held for "lucky mode" (immediate execution)
        this.isLuckyMode = evt.shiftKey;
        await this.startRecording();
      });
      this.pushToTalkBtn.addEventListener('mouseup', () => this.stopRecording());
      this.pushToTalkBtn.addEventListener('mouseleave', () => this.stopRecording());
    }
    
    // Set up Enter button
    if (this.enterBtn) {
      this.enterBtn.addEventListener('click', () => this.sendEnter());
    }
    
    // Set up Delete button  
    if (this.deleteBtn) {
      this.deleteBtn.addEventListener('click', () => this.sendDeleteWord());
    }
    
    // Set up terminal
    await this.setupTerminal();
    
    lively.ensureID(this);
  }
  
  connectedCallback() {
    lively.removeEventListener(lively.ensureID(this), document.documentElement);    
    lively.addEventListener(lively.ensureID(this), document.documentElement, "keydown", evt => this.onGlobalKeyDown(evt));
    
    // Add keypress handler to prevent default for F4 and Shift+F4
    lively.addEventListener(lively.ensureID(this) + "_keypress", document.documentElement, "keypress", evt => this.onGlobalKeyPress(evt));
  }
  
  disconnectedCallback() {
    lively.removeEventListener(lively.ensureID(this), document.documentElement); 
    lively.removeEventListener(lively.ensureID(this) + "_keypress", document.documentElement);
    if (CurrentClaudeCodeInstance === this) CurrentClaudeCodeInstance = null;
  }

  initializeColorSchemes() {
    this.colorSchemes = {
      'default': {
        name: 'Default',
        theme: {
          selectionBackground: '#316AC5',
          selectionForeground: '#ffffff',
          selectionInactiveBackground: 'rgba(49, 106, 197, 0.3)'
        }
      },
      'dark': {
        name: 'Dark',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          cursorAccent: '#1e1e1e',
          selectionBackground: '#264f78',
          selectionForeground: '#ffffff',
          selectionInactiveBackground: 'rgba(38, 79, 120, 0.3)',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#ffffff'
        }
      }
    };
    
    this.currentColorScheme = this.loadColorScheme() || 'dark';
  }
  
  loadColorScheme() {
    return lively.preferences.get('LivelyClaudeCode_colorScheme');
  }

  saveColorScheme(schemeName) {
    return lively.preferences.set('LivelyClaudeCode_colorScheme', schemeName);
  }

  setColorScheme(schemeName) {
    if (!this.colorSchemes[schemeName]) {
      lively.warn(`Color scheme '${schemeName}' not found`);
      return;
    }
    
    this.currentColorScheme = schemeName;
    this.saveColorScheme(schemeName);
    
    if (this.term) {
      this.term.options.theme = this.colorSchemes[schemeName].theme;
    }
    
    lively.notify(`Applied color scheme: ${this.colorSchemes[schemeName].name}`);
  }

  // Push-to-talk functionality (from openai-audio-chat)
  set isRecording(recording) {
    this.classList.toggle("recording", recording);
    this.pushToTalkBtn.classList.toggle("recording", recording);
    
    if (recording) {
      this.pushToTalkBtn.innerHTML = '<i class="fa fa-stop" aria-hidden="true"></i> Recording...';
      this.statusIndicator.textContent = "Recording";
      this.statusIndicator.className = "status-indicator recording";
      this.statusIndicator.style.display = "block";
    } else {
      this.pushToTalkBtn.innerHTML = '<i class="fa fa-microphone" aria-hidden="true"></i> Push F4 to Talk';
      this.statusIndicator.textContent = "Ready";
      this.statusIndicator.className = "status-indicator";
      this.statusIndicator.style.display = "none";
    }
  }

  get isRecording() {
    return this.classList.contains("recording");
  }

  // F4 key handling: both global and terminal context
  async onGlobalKeyDown(evt) {
    // LOG ALL KEYDOWN EVENTS FOR DEBUGGING
    console.log("🔽 KEYDOWN:", {
      key: evt.key,
      code: evt.code,
      shiftKey: evt.shiftKey,
      ctrlKey: evt.ctrlKey,
      altKey: evt.altKey,
      metaKey: evt.metaKey,
      target: evt.target.tagName,
      type: evt.type
    });
    
    // #KeyboardShortcut Hold-F4 to use push to talk, Shift+F4 for immediate execution (lucky mode)
    // Called either globally or from terminal's attachCustomKeyEventHandler
    // Use evt.code to distinguish actual F4 function key from Shift+4 character
    if ((evt.key === "F4" || evt.code === "F4") && !this.isRecording && !CurrentClaudeCodeInstance && lively.isInBody(this)) {
      console.log("🎯 F4 DETECTED - Starting recording with shift:", evt.shiftKey);
      
      // Prevent default behavior for both F4 and Shift+F4
      evt.preventDefault();
      evt.stopPropagation();
      
      CurrentClaudeCodeInstance = this;
      
      // Store whether Shift is held for "lucky mode" (immediate execution)
      this.isLuckyMode = evt.shiftKey;
      
      // Set up keyup listener for F4 release (must be global to catch release anywhere)
      lively.addEventListener(lively.ensureID(this), document.documentElement, "keyup", evt => this.onGlobalKeyUp(evt));
      
      await this.startRecording();
    }
  }
  
  onGlobalKeyPress(evt) {
    // LOG ALL KEYPRESS EVENTS FOR DEBUGGING
    console.log("🔄 KEYPRESS:", {
      key: evt.key,
      code: evt.code,
      shiftKey: evt.shiftKey,
      ctrlKey: evt.ctrlKey,
      charCode: evt.charCode,
      keyCode: evt.keyCode,
      target: evt.target.tagName,
      type: evt.type
    });
    
    // Prevent default behavior for F4 keypress events (including Shift+F4)
    // This stops weird characters from being generated in terminals or inputs
    if (evt.key === "F4" || evt.code === "F4") {
      console.log("🎯 F4 KEYPRESS - Preventing default");
      evt.preventDefault();
      evt.stopPropagation();
    }
  }
  
  onGlobalKeyUp(evt) {
    // LOG ALL KEYUP EVENTS FOR DEBUGGING
    console.log("🔼 KEYUP:", {
      key: evt.key,
      code: evt.code,
      shiftKey: evt.shiftKey,
      ctrlKey: evt.ctrlKey,
      target: evt.target.tagName,
      type: evt.type,
      isRecording: this.isRecording
    });
    
    if ((evt.key === "F4" || evt.code === "F4") && this.isRecording) {
      console.log("🎯 F4 KEYUP - Stopping recording");
      lively.removeEventListener(lively.ensureID(this), document.documentElement, "keyup");    
      this.stopRecording();
      CurrentClaudeCodeInstance = null;
    }
  }

  async startRecording() {
    this.isRecording = true;
    await this.audioRecorder.startRecording();
    
    const mode = this.isLuckyMode ? ' (Lucky mode - auto-execute)' : '';
    lively.success('Claude Code recording started' + mode);
  }
  
  async stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    
    this.statusIndicator.textContent = "Processing";
    this.statusIndicator.className = "status-indicator processing";
    this.statusIndicator.style.display = "block";
    
    try {
      var blob = await this.audioRecorder.stopRecording();
      
      // Process audio with speech-to-text
      const transcriptResult = await Speech.transcript(blob);
      const transcribedText = transcriptResult.text;
      
      // Show the transcribed text to user
      lively.notify('Speech recognized', transcribedText);
      
      // Paste the text to terminal (allows editing before pressing Enter)
      if (this.term && transcribedText.trim()) {
        this.term.paste(transcribedText);
        // Give focus to terminal so user can immediately edit or press Enter
        this.term.focus();
        
        // Lucky mode: If Shift was held, automatically execute the command
        if (this.isLuckyMode) {
          // Small delay to ensure paste completes before sending Enter
          setTimeout(() => {
            this.sendEnter();
          }, 100);
          // Reset lucky mode flag
          this.isLuckyMode = false;
        }
      }
      
      // Hide status after a moment
      setTimeout(() => {
        this.statusIndicator.style.display = "none";
      }, 1000);
      
    } catch (error) {
      lively.warn('Recording failed: ' + error.message);
      this.statusIndicator.style.display = "none";
    }
  }

  // Push-to-talk button uses mousedown/mouseup events, not click
  
  sendEnter() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Send Enter key directly through websocket (carriage return)
      this.socket.send('\r');
      if (this.term) {
        this.term.focus();
      }
    } else if (this.term) {
      // Fallback: try to trigger onData event manually
      // This simulates what happens when user presses Enter
      this.term._core._onKey('\r', {key: 'Enter', domEvent: {keyCode: 13}});
      this.term.focus();
    }
  }
  
  sendDeleteWord() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Send Ctrl+W sequence directly through websocket (delete previous word)
      // Ctrl+W is ASCII character 23 (0x17)
      this.socket.send('\x17');
      if (this.term) {
        this.term.focus();
      }
    } else if (this.term) {
      // Fallback: try to trigger onData event manually
      // This simulates what happens when user presses Ctrl+W
      this.term._core._onKey('\x17', {key: 'w', ctrlKey: true, domEvent: {keyCode: 87, ctrlKey: true}});
      this.term.focus();
    }
  }

  // Terminal functionality (from lively-xterm)
  async setupTerminal(force) {
    lively.removeEventListener("claude-code-terminal", this);
    lively.addEventListener("claude-code-terminal", this, 'contextmenu', evt => this.onContextMenu(evt), false);
    lively.addEventListener("claude-code-terminal", this, 'extent-changed', debounce.call(evt => { this.onExtentChanged(evt); }, 500));
    
    // Use current lively4-server base URL
    if (!this.url) {
      this.url = lively4url;
    }
    
    if (!this.cwd) {
      this.cwd = "/lively4-core";
    }
    
    if (!this.command) {
      this.command = "claude -c";
    }
    
    await this.openTerminal();
    if (force || !this.session) {
      await this.newSession();
    }
    await this.connectSession();
  }

  async openTerminal() {
    this.terminalContainer.innerHTML = "";
     
    // Get the current color scheme theme
    var currentTheme = this.colorSchemes[this.currentColorScheme].theme;
    
    // Configure terminal
    this.term = new Terminal({
      scrollback: 1000,
      cursorBlink: true,
      fontFamily: 'Monaco, "Lucida Console", monospace',
      fontSize: 14,
      lineHeight: 1.0,
      theme: currentTheme
    });
    
    // Create and load the fit addon
    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    
    this.term.open(this.terminalContainer);
    this.fitAddon.fit();
    
    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Force a refresh after fitting
    setTimeout(() => {
      if (this.term) {
        this.term.refresh(0, this.term.rows - 1);
      }
    }, 100);
  }

  setupKeyboardShortcuts() {
    if (!this.term) return;
    
    this.term.attachCustomKeyEventHandler((evt) => {
      // Terminal key event handler
      
      // F4 - Push-to-talk (context-aware, only when terminal has focus)
      // Use evt.code to distinguish actual F4 function key from Shift+4 character
      if ((evt.key === 'F4' || evt.code === 'F4') && evt.type === "keydown") {
        if (!this.isRecording && !CurrentClaudeCodeInstance) {
          // Call the onGlobalKeyDown handler
          this.onGlobalKeyDown(evt);
        }
        // ALWAYS prevent F4 from reaching xterm.js to avoid escape sequences
        evt.preventDefault();
        return false;
      }
      
      // Ctrl+C - Copy if text is selected, otherwise let terminal handle it
      if (evt.ctrlKey && evt.key === 'c' && !evt.shiftKey && evt.type === "keydown") {
        if (this.term.hasSelection && this.term.hasSelection()) {
          this.copySelection();
          return false;
        }
        return true;
      }
      
      // Ctrl+V - Paste
      if (evt.ctrlKey && evt.key === 'v' && !evt.shiftKey && evt.type === "keydown") {
        evt.preventDefault();
        evt.stopPropagation();
        this.pasteFromClipboard();
        return false;
      }
      
      return true;
    });
  }

  onContextMenu(evt) {
    if (this.lastPointerUp && (Date.now() - this.lastPointerUp < 1000)) {
      evt.stopPropagation();
      evt.preventDefault();
      return;
    }

    var hasSelection = this.term && this.term.hasSelection && this.term.hasSelection();

    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();

      var menuItems = [
        ["reconnect", () => this.reconnect()],
      ];

      // Add color scheme submenu
      var colorSchemeItems = Object.keys(this.colorSchemes).map(key => [
        this.colorSchemes[key].name + (key === this.currentColorScheme ? ' ✓' : ''),
        () => this.setColorScheme(key)
      ]);
      menuItems.push(["color scheme", colorSchemeItems]);

      // Add copy option if text is selected
      if (hasSelection) {
        menuItems.unshift(["copy", () => this.copySelection()]);
      }
      
      menuItems.unshift(["paste", () => this.pasteFromClipboard()]);

      var menu = new ContextMenu(this, menuItems);
      menu.openIn(document.body, evt, this);
      return true;
    }    
  }

  copySelection() {
    if (this.term && this.term.hasSelection && this.term.hasSelection()) {
      var selectedText = this.term.getSelection();
      navigator.clipboard.writeText(selectedText).then(() => {
        lively.notify("copy", selectedText);
      }).catch(() => {
        lively.warn("Failed to copy to clipboard");
      });
    }
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text && this.term) {
        this.term.paste(text);
        lively.notify("paste", text);
      }
    } catch (error) {
      lively.warn("Paste not available - use Ctrl+V");
    }
  }
  
  async reconnect() {
    this.setupTerminal(true);
  }

  async sendCommand(command) {
    if (!this.term) {
      lively.warn("Terminal not initialized");
      return false;
    }
    
    if (!command || typeof command !== 'string') {
      lively.warn("Command must be a non-empty string");
      return false;
    }

    if (!this.session) {
      lively.warn("No terminal session available");
      return false;
    }
    
    try {
      var serverBaseURL = this.url.replace(/\/[^\/]*$/, "");
      const execURL = `${serverBaseURL}/_terminal/exec/${this.session}`;
      
      const response = await fetch(execURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command })
      });
      
      if (!response.ok) {
        lively.warn(`Command execution failed: ${response.status}`);
        return false;
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      lively.warn(`Error executing command: ${error.message}`);
      return false;
    }
  }

  sendText(text) {
    if (!this.term) {
      lively.warn("Terminal not initialized");
      return false;
    }
    
    if (!text || typeof text !== 'string') {
      lively.warn("Text must be a non-empty string");
      return false;
    }
    
    this.term.paste(text);
    return true;
  }
  
  async onResize() {
    if (!this.session || !this.term) {
      return;
    }
    
    try {
      if (this.fitAddon) {
        this.fitAddon.fit();
      }
      
      setTimeout(() => {
        if (this.term) {
          this.term.refresh(0, this.term.rows - 1);
        }
      }, 50);
      
      var cols = this.term.cols;
      var rows = this.term.rows;
      
      if (cols && rows) {
        var serverBaseURL = this.url.replace(/\/[^\/]*$/, "");
        await fetch(`${serverBaseURL}/_terminal/size/${this.session}?cols=${cols}&rows=${rows}`, {
          method: "POST"
        });
      }
    } catch (error) {
      // Silently fail - resize errors are not critical
    }
  }

  // Terminal session management (from lively-xterm)
  get url() {
    return this.getAttribute("url");
  }
  
  set url(s) {
    return this.setAttribute("url", s);
  }

  get cwd() {
    return this.getAttribute("cwd");
  }
  
  set cwd(s) {
    return this.setAttribute("cwd", s);
  }

  get command() {
    return this.getAttribute("command");
  }
  
  set command(s) {
    if (this.getAttribute("command") !== s) {
      this.commandExecuted = false;
    }
    return this.setAttribute("command", s);
  }

  get session() {
    return this._session;
  }
  
  set session(s) {
    this._session = s;
  }

  async getAuthHeaders() {
    const username = await this.loadValue("githubUsername");
    const token = await this.loadValue("githubToken");
    
    return {
      gitusername: username,
      gitpassword: token,
      cwd: this.cwd 
    };
  }

  get storagePrefix() {
    return "LivelySync_";
  }
  
  async loadValue(key) {
    return lively.focalStorage.getItem(this.storagePrefix + key);
  }

  async storeValue(key, value) {
    return lively.focalStorage.setItem(this.storagePrefix + key, value);
  }

  async ensureAuthenticated() {
    try {
      var auth = await this.getAuthHeaders();
      
      if (!auth.gitusername || !auth.gitpassword) {
        const token = await new Promise((resolve, reject) => {
          lively.authGithub.challengeForAuth(Date.now(), async (token) => {
            try {
              const userResponse = await fetch("https://api.github.com/user", {
                headers: { Authorization: "token " + token }
              });
              const user = await userResponse.json();
              const username = user.login;
              
              await this.storeValue("githubUsername", username);
              await this.storeValue("githubToken", token);
              
              lively.notify("GitHub authentication successful");
              resolve(token);
              
            } catch (error) {
              reject(error);
            }
          });
        });
        
        auth = await this.getAuthHeaders();
      }
      
      if (!auth.gitusername || !auth.gitpassword) {
        lively.warn("Authentication cancelled or failed");
        return false;
      }
      
      var serverBaseURL = this.url.replace(/\/[^\/]*$/, "");
      const loginURL = `${serverBaseURL}/_auth/login`;
      
      const loginResponse = await fetch(loginURL, {
        method: "POST",
        headers: {
          'gitusername': auth.gitusername,
          'gitpassword': auth.gitpassword
        }
      });
      
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        lively.warn("Authentication failed: " + loginResponse.status + " - " + errorText);
        return false;
      }
      
      return true;
      
    } catch (error) {
      lively.warn("Authentication failed: " + error.message);
      return false;
    }
  }

  async newSession() {
    try {
      if (!(await this.ensureAuthenticated())) {
        return;
      }
      
      var cols = this.term ? this.term.cols : 88;
      var rows = this.term ? this.term.rows : 24;
      
      var serverBaseURL = this.url.replace(/\/[^\/]*$/, "");
      const createURL = `${serverBaseURL}/_terminal/create?cols=${cols}&rows=${rows}`;
      
      const headers = {};
      if (this.cwd) {
        headers.cwd = this.cwd;
      }
      
      const response = await fetch(createURL, {
        method: "POST",
        headers: headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        lively.warn("Server error creating terminal: " + response.status + " - " + errorText);
        return;
      }
      
      var session = await response.text();
      
      if (parseInt(session) > 0) {
        this.session = session;
        this.commandExecuted = false;
      } else {
        lively.warn("could not get session, because " + session);
      }
    } catch (error) {
      lively.warn("Failed to create terminal session: " + error.message);
    }
  }
  
  async connectSession() {
    if (!this.session) {
      lively.warn("No terminal session available to connect");
      return;
    }
    
    try {
      var serverBaseURL = this.url.replace(/\/[^\/]*$/, "");
      var baseWebSocketURL = serverBaseURL.replace(/^http/, "ws");
      var socketURL = `${baseWebSocketURL}/_terminal/ws/${this.session}`;
      
      this.socket = new WebSocket(socketURL);
      
      this.socket.addEventListener('open', () => {
        lively.notify("Claude Code Terminal connected");
      });
      
      this.socket.addEventListener('error', (error) => {
        lively.warn("WebSocket connection error");
      });
      
      this.socket.addEventListener('close', (event) => {
        lively.notify("Terminal connection closed");
      });
      
      this.attachAddon = new AttachAddon(this.socket);
      this.term.loadAddon(this.attachAddon);
      
      // Execute command after connection is stable
      if (this.command && !this.commandExecuted) {
        setTimeout(async () => {
          await this.sendCommand(this.command);
          this.commandExecuted = true;
        }, 500);
      }
      
    } catch (error) {
      lively.warn("Failed to connect to terminal: " + error.message);
    }
  }
  
  livelyMigrate(other) {
    this.session = other.session;
    this.commandExecuted = other.commandExecuted;
    this.currentColorScheme = other.currentColorScheme;
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  livelyPrepareSave() {
    // do nothing
  } 
  
  onExtentChanged() {
    if (this.fitAddon) {
      this.fitAddon.fit();
    }
  }
  
  async livelyExample() {
    // Component example - initialize with Claude Code ready state
  }
}