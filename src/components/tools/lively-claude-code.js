import Morph from 'src/components/widgets/lively-morph.js';
import {AudioRecorder} from "src/client/audio.js"
import {Speech} from "src/client/openai.js"

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
    
    await this.ensureEmbeddedTerminal();
    
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

  async ensureEmbeddedTerminal() {
    if (!this.terminal) {  
      this.terminal = await lively.create("lively-xterm");
      this.terminal.setAttribute("url", lively4url);
      this.terminal.setAttribute("cwd", "/lively4-core");
      this.terminal.setAttribute("command", "claude -c");
      this.terminal.style.width = "100%";
      this.terminal.style.height = "100%";
      this.setupKeyboardShortcuts(); // only once per instance/
    }
    this.terminal.claudeCode = this // for internal key events 
    this.terminalContainer.appendChild(this.terminal);
    if (this.terminal.fitAddon) {
      this.terminal.fitAddon.fit()
    }
  }

  getTerminal() {
    return this.terminal;
  }

  forwardToTerminal(method, ...args) {
    if (this.terminal && typeof this.terminal[method] === 'function') {
      return this.terminal[method](...args);
    }
    return false;
  }

  async onResize(evt) {
    // Forward resize to embedded terminal
    if (this.terminal && typeof this.terminal.onResize === 'function') {
      await this.terminal.onResize(evt);
    }
  }

  // Push-to-talk functionality (from openai-audio-chat)
  set isRecording(recording) {
    this.classList.toggle("recording", recording);
    this.pushToTalkBtn.classList.toggle("recording", recording);
    
    if (recording) {
      this.statusIndicator.textContent = "Recording";
      this.statusIndicator.className = "status-indicator recording";
    } else {
      this.statusIndicator.textContent = "Ready";
      this.statusIndicator.className = "status-indicator";
    }
  }

  get isRecording() {
    return this.classList.contains("recording");
  }

  // F4 key handling: both global and terminal context
  async onGlobalKeyDown(evt) {

    
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
    // Prevent default behavior for F4 keypress events (including Shift+F4)
    // This stops weird characters from being generated in terminals or inputs
    if (evt.key === "F4" || evt.code === "F4") {
      console.log("🎯 F4 KEYPRESS - Preventing default");
      evt.preventDefault();
      evt.stopPropagation();
    }
  }
  
  onGlobalKeyUp(evt) {
    if ((evt.key === "F4" || evt.code === "F4") && this.isRecording) {
      console.log("🎯 F4 KEYUP - Stopping recording");
      lively.removeEventListener(lively.ensureID(this), document.documentElement, "keyup");    
      this.stopRecording();
      CurrentClaudeCodeInstance = null;
    }
  }

  onXTermKeyEvent(evt) {
    // Terminal key event handler
    // F4 - Push-to-talk (context-aware, only when terminal has focus)
    // Use evt.code to distinguish actual F4 function key from Shift+4 character
    if ((evt.key === 'F4' || evt.code === 'F4') && evt.type === "keydown") {
      if (!this.isRecording && !CurrentClaudeCodeInstance) {
        // Call the onGlobalKeyDown handler
        this.onGlobalKeyDown(evt);
        evt.preventDefault();
        return false;
      }
      // ALWAYS prevent F4 from reaching xterm.js to avoid escape sequences
      evt.preventDefault();
      return false;
    }
    return true;    
  }
  
  
  setupKeyboardShortcuts() {
    // this is only exectued once and not after the migration
    
    if (!this.term) return;
    
    // we don't control this event handler so we have to hack a bit for live reloading
    this.term.attachCustomKeyEventHandler((evt) => {
      return this.terminal.claudeCode.onXTermKeyEvent(evt)
    });
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
      if (this.terminal && transcribedText.trim()) {
        this.terminal.term.paste(transcribedText);
        // Give focus to terminal so user can immediately edit or press Enter
        if (this.terminal.term) {
          this.terminal.term.focus();
        }
        
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
        this.statusIndicator.className = "status-indicator";
      }, 1000);
      
    } catch (error) {
      lively.warn('Recording failed: ' + error.message);
      this.statusIndicator.className = "status-indicator";
    }
  }

  // Push-to-talk button uses mousedown/mouseup events, not click
  sendEnter() {
    if (this.terminal && this.terminal.socket && this.terminal.socket.readyState === WebSocket.OPEN) {
      // Send Enter key directly through websocket (carriage return)
      this.terminal.socket.send('\r');
      if (this.terminal.term) {
        this.terminal.term.focus();
      }
    } 
  }
  
  get socket() {
    if (this.terminal) return this.terminal.socket
  
  }
  
  get term() {
    if (this.terminal  && this.terminal.term) return this.terminal.term
  
  }
  
  sendDeleteWord() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Send Ctrl+W sequence directly through websocket (delete previous word)
      // Ctrl+W is ASCII character 23 (0x17)
      this.socket.send('\x17');
      if (this.term) {
        this.term.focus();
      }
    } 
  }

  async sendCommand(command) {
    return this.forwardToTerminal('sendCommand', command);
  }

  sendText(text) {
    return this.forwardToTerminal('sendText', text);
  }

  async reconnect() {
    return this.forwardToTerminal('reconnect');
  }
  
  livelyMigrate(other) {
    if (other.audioRecorder) {
      this.audioRecorder = other.audioRecorder;
    }
    
    if (other.terminal) {
      this.terminal = other.terminal;
    }
    
    this.isLuckyMode = other.isLuckyMode;
  }

}