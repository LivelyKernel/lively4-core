import Morph from 'src/components/widgets/lively-morph.js';
import {AudioRecorder} from "src/client/audio.js"
import {Speech} from "src/client/openai.js"
import ClaudeSessions from 'src/client/claude-sessions.js';
import moment from 'src/external/moment.js';

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
    this.sessionDisplay = this.get("#sessionDisplay");
    this.sessionChooser = this.get("#sessionChooser");
    this.projectChooser = this.get("#projectChooser");
    
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
    
    // Set up project chooser
    if (this.projectChooser) {
      this.projectChooser.addEventListener('change', () => this.onProjectChanged());
      await this.updateProjectList();
    }
    
    // Set up session chooser
    if (this.sessionChooser) {
      this.sessionChooser.addEventListener('change', () => this.onSessionChanged());
      await this.updateSessionList();
    }
    
    await this.ensureEmbeddedTerminal();
    
    this.updateWindowTitle();
    
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
  
  fitTerminal() {
    if (this.terminal.fitAddon) {
      this.terminal.fitAddon.fit()
    }
  }

  async ensureEmbeddedTerminal() {
    const isNewTerminal = !this.terminal;
    
    if (!this.terminal) {  
      this.terminal = await lively.create("lively-xterm");
      this.terminal.setAttribute("url", lively4url);
      // Keep relative path for terminal - the cd command will handle the full path
      this.terminal.setAttribute("cwd", "/" + this.getCurrentProject());
      // No automatic command - we'll use sendCommand() manually
      this.terminal.style.width = "100%";
      this.terminal.style.height = "100%";
      this.setupKeyboardShortcuts(); // only once per instance/
    }
    
    // Store whether this is a fresh terminal
    this.isFreshTerminal = isNewTerminal;
    this.terminal.claudeCode = this // for internal key events 
    this.terminalContainer.appendChild(this.terminal);
    this.fitTerminal()
    
    // Set up output monitoring for session detection
    this.setupOutputMonitoring();
    
    // Start manual session detection and Claude startup
    this.startManualClaudeSetup();
  }

  async startManualClaudeSetup() {
    // Only start Claude setup if this is a fresh terminal
    if (!this.isFreshTerminal) {
      console.log("Reusing existing terminal, skipping Claude startup");
      return;
    }
    
    // Wait for terminal to be fully ready
    await this.waitForTerminalReady();
    
    // Step 1: Detect current session ID from filesystem
    // await this.detectSessionFromFilesystem();
    
    // Step 2: Start Claude with detected session or fallback
    await this.startClaudeManually();
    
    // give claude a chance to relayout 
    // #TODO does not do anything if the size does not change
    // this.fitTerminal()
  }

  async waitForTerminalReady() {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.terminal && this.terminal.socket && 
            this.terminal.socket.readyState === WebSocket.OPEN) {
          // Give it a moment to be fully ready
          setTimeout(resolve, 500);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  async detectSessionFromFilesystem() {
    // Send command to get most recent session file
    const currentProject = this.getCurrentProject();
    const command = `ls -t ~/.claude/projects/*${currentProject}/*.jsonl 2>/dev/null | head -1 | xargs basename -s .jsonl 2>/dev/null || echo "no-session"`;
    
    console.log("Sending command:", command);
    try {
      const result = await this.sendCommand(command);
      console.log("Command result:", result);
      
      if (result && result.output) {
        const output = result.output;
        console.log("Command output:", output);
        
        // Look for UUID pattern in the output
        const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
        const match = output.match(uuidPattern);
        
        if (match) {
          const sessionId = match[1];
          this.currentSessionId = sessionId;
          this.updateWindowTitle();
          console.log(`✅ Detected session ID: ${sessionId}`);
          
          // Continue with Claude startup after a short delay
          setTimeout(() => this.startClaudeManually(), 500);
        } else {
          console.log("No UUID found in output");
        }
      } else {
        console.log("No output in result");
      }
    } catch (error) {
      console.error("Command failed:", error);
    }
  }

  setupOutputMonitoring() {
    // Keep this simple for now - just for general terminal monitoring if needed
    if (!this.terminal || !this.terminal.term) {
      setTimeout(() => this.setupOutputMonitoring(), 100);
      return;
    }
    
    // Monitor terminal output (can be used for other purposes later)
    this.terminal.term.onData((data) => {
      // For now, just log terminal interactions
      // console.log("Terminal data:", JSON.stringify(data));
    });
  }

  updateWindowTitle() {
    const currentProject = this.getCurrentProject();
    const baseTitle = `Claude Code Terminal (${currentProject})`;
    if (this.currentSessionId) {
      // Show first 8 characters for readability in title
      const shortId = this.currentSessionId.substring(0, 8);
      this.windowTitle = `${baseTitle} [${shortId}...]`;
      
      // Update session display in header
      if (this.sessionDisplay && this.sessionIdElement) {
        this.sessionDisplay.style.display = "flex";
        this.sessionIdElement.textContent = shortId + "...";
        this.sessionIdElement.title = this.currentSessionId; // Full ID in tooltip
      }
    } else {
      this.windowTitle = baseTitle;
      
      // Hide session display if no session ID
      if (this.sessionDisplay) {
        this.sessionDisplay.style.display = "";
      }
    }
  }

  async startClaudeManually() {
    // Start Claude with detected session, or fall back to continue, or start fresh
    const sessionId = this.currentSessionId;
    
    if (sessionId) {
      // Try to resume the detected session first
      const resumeCommand = `claude -r ${sessionId}`;
      console.log("Trying to resume session:", resumeCommand);
      
      const result = await this.sendCommand(resumeCommand)  
      // Check if the resume failed (session not found)
      if (result && result.output && result.output.includes("No conversation found")) {
        lively.warn("No claude session not found");
      }
    } else {
      // No session detected, start fresh Claude
      console.log("No session detected, starting fresh Claude");
      // await this.sendCommand("claude -d verbose -c");
      await this.sendCommand("claude -c");
    }
  }

  getCurrentSessionId() {
    return this.currentSessionId;
  }

  async getProjectDirectories() {
    try {
      const parentUrl = lively4url.replace(/\/[^\/]*$/, ""); // Remove last path segment
      const json = await lively.files.statFile(parentUrl).then(JSON.parse);
      if (!json || !json.contents) return ["lively4-core"]; // fallback
      
      // Get all directory names
      const allDirs = json.contents
        .filter(ea => ea.type === "directory")
        .map(ea => ea.name)
        .filter(name => !name.startsWith(".")); // Filter out hidden/trash directories
      
      // Use claude-sessions.js to filter directories that have Claude projects
      const filteredDirs = await ClaudeSessions.filterDirectoriesWithClaudeProjects(
        allDirs, 
        this.getProjectRoot()
      );
      
      return filteredDirs; // Already sorted in ClaudeSessions.filterDirectoriesWithClaudeProjects
    } catch (error) {
      console.error("Failed to get project directories:", error);
      return ["lively4-core"]; // fallback
    }
  }

  async updateProjectList() {
    if (!this.projectChooser) return;
    const projects = await this.getProjectDirectories();
    this.projectChooser.setOptions(projects);
    
    // Set from attribute first, then fallback to default
    const savedProject = this.getAttribute("project");
    if (savedProject && projects.includes(savedProject)) {
      this.projectChooser.value = savedProject;
    } else if (!this.projectChooser.value || !projects.includes(this.projectChooser.value)) {
      this.setCurrentProject("lively4-core");
    }
  }

  async onProjectChanged() {
    const selectedProject = this.projectChooser.value;
    console.log("Project changed to:", selectedProject);
    
    // Immediately show loading in session chooser
    if (this.sessionChooser) {
      this.sessionChooser.value = "-- loading --";
      this.sessionChooser.setOptions([]);
    }
    
    // Save project selection in attribute
    this.setCurrentProject(selectedProject);
    this.updateWindowTitle();
    
    // If terminal exists, interrupt current command and cd to new project
    if (this.terminal && this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        // Send Ctrl+C three times to interrupt any running commands
        await this.sendMultipleCtrlC(3);
        
        // Wait a moment for the interrupts to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Send cd command to change to the project directory
        const cdCommand = `cd ${this.getFullProjectPath()}`;
        await this.sendCommand(cdCommand);
        
        // Wait a moment for cd to complete, then start Claude
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Start Claude with latest session (claude -c automatically chooses latest)
        await this.sendCommand("claude -c");
        
        // Update session list for new project and detect current session
        await this.updateSessionList();
        
        lively.notify(`Switched to project: ${selectedProject} and started Claude`);
        
        // Give focus back to terminal
        if (this.term) {
          this.term.focus();
        }
      } catch (error) {
        console.error("Error switching project:", error);
        lively.warn(`Failed to switch to project: ${selectedProject}`);
      }
    } else {
      lively.notify(`Project set to: ${selectedProject} (will apply when terminal starts)`);
    }
  }

  getCurrentProject() {
    return this.getAttribute("project") || this.projectChooser?.value || "lively4-core";
  }

  setCurrentProject(project) {
    this.setAttribute("project", project);
    if (this.projectChooser) {
      this.projectChooser.value = project;
    }
  }

  async getSessionData() {
    try {
      const currentProject = this.getCurrentProject();
      // Get flattened project name for Claude sessions
      const projectRoot = this.getProjectRoot();
      const absoluteRoot = projectRoot.startsWith('~/') ? 
        projectRoot.replace('~/', '/home/jens/') : projectRoot;
      const fullPath = absoluteRoot + "/" + currentProject;
      const flattenedProjectName = ClaudeSessions.flattenPath(fullPath);
      
      // Get sessions with message counts for this specific project (already sorted by most recent first)
      const sessions = await ClaudeSessions.discoverSessionsWithCounts(flattenedProjectName);
      return sessions; // Returns full session objects with metadata including messageCount
    } catch (error) {
      console.error("Failed to get session data:", error);
      return [];
    }
  }

  async getSessionIds() {
    const sessions = await this.getSessionData();
    return sessions.map(session => session.sessionId);
  }

  async updateSessionList() {
    if (!this.sessionChooser) return;
    
    const sessions = await this.getSessionData();
    
    // Create formatted session options with JSX spans for table-like alignment
    const sessionOptions = sessions.map(session => {
      const shortId = session.sessionId.substring(0, 6);
      const timeAgo = moment(session.modified).fromNow();
      const messageCount = session.messageCount || 0;
      
      const text = `${shortId}, ${timeAgo}, ${messageCount}msgs`
      
      return {
        value: session.sessionId,
        string: text
      };
    });
    
    // Set dropdown options with styled HTML
    this.sessionChooser.setOptions(sessionOptions);
    
    // Set display to show session count instead of selecting a specific session
    if (sessions.length > 0) {
      this.sessionChooser.value = `-- ${sessions.length} session${sessions.length === 1 ? '' : 's'} --`;
      
      // Track the most recent session internally (what claude -c would choose)
      const sessionIds = sessions.map(s => s.sessionId);
      if (!this.currentSessionId || !sessionIds.includes(this.currentSessionId)) {
        this.currentSessionId = sessionIds[0]; // Most recent
        this.updateWindowTitle();
      }
    } else {
      this.sessionChooser.value = "-- no sessions --";
      this.currentSessionId = null;
      this.updateWindowTitle();
    }
  }

  async onSessionChanged() {
    const selectedSessionId = this.sessionChooser.value;
    console.log("Session changed to:", selectedSessionId);
    
    // Skip if user selected the count display (starts with "--")
    if (!selectedSessionId || selectedSessionId.startsWith('--')) {
      return;
    }
    
    // Update current session ID (now directly from the value)
    this.currentSessionId = selectedSessionId;
    this.updateWindowTitle();
    
    // If terminal exists and session is selected, switch to it
    if (selectedSessionId && this.terminal && this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        // Send Ctrl+C three times to interrupt Claude
        await this.sendMultipleCtrlC(3);
        
        // Wait a moment for the interrupts to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Resume the selected session
        const resumeCommand = `claude -r ${selectedSessionId}`;
        await this.sendCommand(resumeCommand);
        
        lively.notify(`Switched to session: ${selectedSessionId.substring(0, 8)}...`);
        
        // Give focus back to terminal
        if (this.term) {
          this.term.focus();
        }
        
        // Update the display back to count format
        await this.updateSessionList();
      } catch (error) {
        console.error("Error switching session:", error);
        lively.warn(`Failed to switch to session: ${selectedSessionId.substring(0, 8)}...`);
      }
    } else {
      // Just notify if terminal not ready
      if (selectedSessionId) {
        lively.notify(`Session selected: ${selectedSessionId.substring(0, 8)}... (will apply when terminal is active)`);
      }
    }
  }

  getProjectRoot() {
    return this.getAttribute("projectroot") || "~/lively4";
  }

  getFullProjectPath() {
    return `${this.getProjectRoot()}/${this.getCurrentProject()}`;
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
    if (this.terminal) {
      var result = this.terminal.handleCopyAndPaste(evt)
      if (result !== undefined) return result
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

  sendCtrlC() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Send Ctrl+C sequence directly through websocket 
      // Ctrl+C is ASCII character 3 (0x03)
      this.socket.send('\x03');
    }
  }

  async sendMultipleCtrlC(count = 3) {
    for (let i = 0; i < count; i++) {
      this.sendCtrlC();
      // Small delay between each Ctrl+C
      await new Promise(resolve => setTimeout(resolve, 100));
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
      this.currentSessionId = other.currentSessionId;
    }
    
    // Preserve project selection and root
    if (other.getAttribute("project")) {
      this.setAttribute("project", other.getAttribute("project"));
    }
    if (other.getAttribute("projectroot")) {
      this.setAttribute("projectroot", other.getAttribute("projectroot"));
    }
    if (other.projectChooser && this.projectChooser) {
      this.projectChooser.value = other.projectChooser.value;
    }
    
    this.isLuckyMode = other.isLuckyMode;
  }

}