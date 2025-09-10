import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessions from 'src/client/claude-sessions.js';
import { Panning, Zooming } from "src/client/html.js"
/*MD # Claude Conversations Graph

Visualizes Claude conversation structures as a graph showing how messages connect to each other through parent-child relationships.

- Each message is shown as a circle
- Edges connect child messages to their parents
- Messages with the same UUID are shown only once
- Different colors can represent different roles (user/assistant)

MD*/


export default class LivelyClaudeConversations extends Morph {

  initialize() {
    this.windowTitle = "Claude Conversations Graph";
    
    // Initialize UI references
    this.projectSelect = this.get("#projectSelect");
    this.loadButton = this.get("#loadButton");
    this.loading = this.get("#loading");
    
    this.stats = this.get("#stats");
    this.messageCount = this.get("#messageCount");
    this.sessionCount = this.get("#sessionCount");
    this.conversationCount = this.get("#conversationCount");
    
    // Initialize data structures
    this._currentProject = this._currentProject  || this.getAttribute('selected-project');
    this._availableProjects = this._availableProjects ||this._availableProjects || [];
    this._messages = this._messages || new Map(); // uuid -> message data
    this._sessions = this._sessions || [];
    this._conversations = this._conversations || [];
    
    this.registerButtons();
    
    // Setup project selector
    this.projectSelect.addEventListener('change', () => {
      this.setAttribute('selected-project', this.projectSelect.value);
      this._currentProject = this.projectSelect.value;
    });
    
    // Load projects
    if (this._conversations.length == 0) {
      this.loadProjects();
    } else {
      this.populateProjectDropdown();
      this.renderGraph()
    }
  }
  
  async loadProjects() {
    try {
      this._availableProjects = await ClaudeSessions.loadProjects();
      this.populateProjectDropdown();
    } catch (error) {
      console.error('Failed to load projects:', error);
      this._availableProjects = [];
      this.populateProjectDropdown();
    }
  }
  
  populateProjectDropdown() {
    if (!this.projectSelect) return;
    
    // Clear existing options
    this.projectSelect.innerHTML = '';
    
    if (this._availableProjects.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No projects found';
      option.disabled = true;
      this.projectSelect.appendChild(option);
      return;
    }
    
    // Add "Select Project" option
    const selectOption = document.createElement('option');
    selectOption.value = '';
    selectOption.textContent = 'Select Project';
    this.projectSelect.appendChild(selectOption);
    
    // Add individual project options
    this._availableProjects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.name;
      option.textContent = project.name;
      this.projectSelect.appendChild(option);
    });
    
    // Set current selection
    const projectToSelect = this._currentProject || this.getAttribute('selected-project') || '';
    if (projectToSelect) {
      this.projectSelect.value = projectToSelect;
    }
  }
  
  async onLoadButton() {
    if (!this._currentProject) {
      lively.notify('Please select a project first');
      return;
    }
    
    this.showLoading();
    
    try {
      // Load all sessions for the project
      await this.loadAllSessions();
      
      // Build message graph (organize sessions and messages)
      this.buildMessageGraph();
      
      // Render the graph
      await this.renderGraph();
      
      this.updateStats();
      
    } catch (error) {
      this.showError(`Failed to load conversations: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }
  
  async loadAllSessions() {
    // Discover conversations (which group sessions by initial message UUID)
    this._conversations = await ClaudeSessions.discoverConversations(this._currentProject);
    
    // Clear previous data
    this._messages.clear();
    this._sessions = [];
    
    // Load all messages from all conversations and sessions
    for (const conversation of this._conversations) {
      // Collect all session files from this conversation
      this._sessions.push(...conversation.sessions);
      
      for (const sessionFile of conversation.sessions) {
        try {
          const messages = await ClaudeSessions.loadSessionContent(sessionFile.path);
          
          messages.forEach(message => {
            if (message.uuid && !this._messages.has(message.uuid)) {
              // Add message with metadata
              this._messages.set(message.uuid, {
                ...message,
                sessionId: sessionFile.sessionId,
                sessionPath: sessionFile.path,
                conversationId: conversation.conversationId,
                conversationTitle: conversation.title,
                role: message.message?.role || message.role || 'unknown',
                isUserMessage: message.type === 'user' && !message.toolUseResult
              });
            }
          });
          
        } catch (error) {
          console.warn(`Failed to load session ${sessionFile.path}:`, error);
        }
      }
    }
  }
  
  buildMessageGraph() {
    // Conversations are already loaded from ClaudeSessions.discoverConversations()
    // Now we need to organize them for incremental session visualization
    
    // For each conversation, organize sessions and messages
    this._conversations.forEach(conversation => {
      // Sort sessions by modification time (oldest first for proper nesting)
      conversation.sessions.sort((a, b) => {
        return new Date(a.modified).getTime() - new Date(b.modified).getTime();
      });
      
      // Group messages by session within this conversation
      conversation.sessionMessages = new Map(); // sessionId -> Set of messageUuids
      
      conversation.sessions.forEach(session => {
        conversation.sessionMessages.set(session.sessionId, new Set());
      });
      
      // Add messages to their respective sessions
      this._messages.forEach((message, uuid) => {
        if (message.conversationId === conversation.conversationId) {
          const sessionMessages = conversation.sessionMessages.get(message.sessionId);
          if (sessionMessages) {
            sessionMessages.add(uuid);
          }
        }
      });
    });
  }
  
  findConversationRoot(parentUuid) {
    const visited = new Set();
    let current = parentUuid;
    
    while (current && !visited.has(current)) {
      visited.add(current);
      const message = this._messages.get(current);
      if (!message) break;
      
      if (!message.parentUuid) {
        return current; // Found the root
      }
      current = message.parentUuid;
    }
    
    return null; // Couldn't find root or cycle detected
  }
  
  async renderGraph() {
    if (this._messages.size === 0) {
      this.get("#content").innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">No messages found</div>';
      return;
    }
    
    // Clear content and set up pane/details structure like literature-graph
    this.get("#content").innerHTML = "";
    
    this.details = <div class="details" style="position:absolute; display: none; z-index: 1000; background: #FBFBFB; padding: 10px; border: 1px solid gray; border-radius: 5px; max-width: 400px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"></div>;
    this.pane = <div id="root">
      {this.details}
    </div>;
    this.get("#content").appendChild(this.pane);
    
    // Initialize panning on the pane
    new Panning(this.pane);
    
    // Create Graphviz DOT notation
    let dot = 'digraph ConversationGraph {\n';
    dot += '  rankdir=TB;\n'; // Top to bottom layout
    dot += '  ranksep=0.3;\n'; // Minimum separation between ranks (vertical spacing)
    dot += '  nodesep=0.2;\n'; // Minimum separation between nodes (horizontal spacing)
    dot += '  node [shape=circle, width=0.1, height=0.1];\n';
    dot += '  edge [arrowsize=0.2, minlen=1];\n';
    
    // Create nested subgraphs: conversations contain sessions, sessions contain messages
    this._conversations.forEach((conversation, convIndex) => {
      // Main conversation cluster
      dot += `  subgraph cluster_conv_${convIndex} {\n`;
      dot += `    label="${this.escapeLabel(this.getConversationDisplayTitle(conversation))}";\n`;
      dot += `    style="rounded,filled";\n`;
      dot += `    fillcolor="#f0f0f0";\n`;
      dot += `    color="#666";\n`;
      dot += `    penwidth=2;\n`;
      
      // Create incremental session visualization - each session contains messages from previous sessions plus new ones
      // Sort sessions by date to show proper incremental relationship
      const sortedSessions = [...conversation.sessions].sort((a, b) => 
        new Date(a.modified).getTime() - new Date(b.modified).getTime()
      );
      
      // Build cumulative message sets for incremental visualization
      const cumulativeMessages = new Map(); // sessionId -> Set of all messages up to that session
      const sessionOnlyMessages = new Map(); // sessionId -> Set of messages unique to that session
      
      sortedSessions.forEach((session, sessionIndex) => {
        const currentSessionMessages = conversation.sessionMessages.get(session.sessionId) || new Set();
        
        // Get all messages from previous sessions
        let allPreviousMessages = new Set();
        for (let i = 0; i < sessionIndex; i++) {
          const prevSession = sortedSessions[i];
          const prevMessages = conversation.sessionMessages.get(prevSession.sessionId) || new Set();
          prevMessages.forEach(uuid => allPreviousMessages.add(uuid));
        }
        
        // Messages unique to this session (not in any previous session)
        const uniqueMessages = new Set();
        currentSessionMessages.forEach(uuid => {
          if (!allPreviousMessages.has(uuid)) {
            uniqueMessages.add(uuid);
          }
        });
        
        sessionOnlyMessages.set(session.sessionId, uniqueMessages);
        
        // Cumulative messages = all previous + current unique
        const cumulative = new Set([...allPreviousMessages, ...uniqueMessages]);
        cumulativeMessages.set(session.sessionId, cumulative);
      });
      
      // Create nested session clusters (newest session on outside, oldest on inside)
      sortedSessions.reverse().forEach((session, reverseIndex) => {
        const sessionIndex = sortedSessions.length - 1 - reverseIndex;
        const uniqueMessages = sessionOnlyMessages.get(session.sessionId);
        
        // Only create session cluster if it has unique messages or is the first session
        if (uniqueMessages.size > 0 || sessionIndex === 0) {
          // Session subcluster
          dot += `    subgraph cluster_sess_${convIndex}_${sessionIndex} {\n`;
          dot += `    label="Session ${session.sessionId.substring(0, 8)} (${new Date(session.modified).toLocaleDateString()}) +${uniqueMessages.size} msgs";\n`;
          dot += `    style="rounded,filled";\n`;
          dot += `    fillcolor="${this.getSessionColor(sessionIndex)}";\n`;
          dot += `    color="#333";\n`;
          dot += `    penwidth=${reverseIndex === 0 ? 2 : 1};\n`; // Thicker border for outermost session
          dot += `    sessionId="${session.sessionId}";\n`; // Custom attribute for click detection
        }
      });
      
      // Add all messages (they'll appear in the innermost cluster that contains them)
      const allConversationMessages = new Set();
      conversation.sessions.forEach(session => {
        const messages = conversation.sessionMessages.get(session.sessionId) || new Set();
        messages.forEach(uuid => allConversationMessages.add(uuid));
      });
      
      allConversationMessages.forEach(messageUuid => {
        if (this._messages.has(messageUuid)) {
          const message = this._messages.get(messageUuid);
          const color = this.getMessageColor(message);
          const title = this.getMessageTitle(message);
          
          dot += `      "${messageUuid}" [label="${messageUuid.substring(0, 4)}", fillcolor="${color}", style="filled", tooltip="${title}", title="${messageUuid}"];\n`;
        }
      });
      
      // Close all the session subclusters
      sortedSessions.forEach((session, sessionIndex) => {
        const uniqueMessages = sessionOnlyMessages.get(session.sessionId);
        if (uniqueMessages.size > 0 || sessionIndex === sortedSessions.length - 1) {
          dot += `    }\n`;
        }
      });
      
      dot += `  }\n`;
    });
    
    // Add edges (parent-child relationships) - these go outside the subgraphs
    this._messages.forEach((message, uuid) => {
      if (message.parentUuid && this._messages.has(message.parentUuid)) {
        dot += `  "${message.parentUuid}" -> "${uuid}";\n`;
      }
    });
    
    dot += '}';
    
    // Render using Graphviz
    await this.renderDotGraph(dot);
  }
  
  getMessageColor(message) {
    // Color by role
    if (message.isUserMessage || message.role === 'user') {
      return '#4CAF50'; // Green for user messages
    } else if (message.role === 'assistant') {
      return '#2196F3'; // Blue for assistant messages
    } else {
      return '#FFC107'; // Yellow for other/unknown
    }
  }
  
  getMessageTitle(message) {
    const role = message.role || 'unknown';
    const sessionId = message.sessionId ? message.sessionId.substring(0, 8) : 'unknown';
    const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : 'no timestamp';
    
    return `Role: ${role}\\nSession: ${sessionId}\\nTime: ${timestamp}`;
  }
  
  async renderDotGraph(dot) {
    try {
      // Create and configure graphviz-dot component (following literature-graph pattern)
      this.graphviz = await (<graphviz-dot server="true"></graphviz-dot>);
      this.graphviz.style.display = 'inline-block';
      
      // Set the DOT content and render
      this.graphviz.innerHTML = `<script type="graphviz">${dot}</script>`;
      this.graphviz.setAttribute("engine", "dot");
      
      this.pane.appendChild(this.graphviz);
      
      await this.graphviz.updateViz();
      
      // Initialize zooming on the graphviz element
      this.zooming = new Zooming(this.graphviz, {
        minZoom: 0.1,
        maxZoom: 5.0,
        zoomStep: 0.1,
        transformOrigin: 'top left'
      });
      
      // Restore previous zoom level if available
      if (this._zoomLevel) {
        this.zooming.setZoom(this._zoomLevel);
      }
      
      // Add click handlers to SVG nodes (following literature-graph pattern)
      this.addNodeClickHandlers();
      
    } catch (error) {
      console.error('Failed to render graph with graphviz-dot:', error);
      this.showError(`Failed to render graph: ${error.message}`);
    }
  }
  
  addNodeClickHandlers() {
    try {
      // Add click handlers to message nodes (both ellipses and text since we now have labels)
      const messageNodes = this.graphviz.shadowRoot.querySelectorAll("g.node ellipse, g.node text");
      messageNodes.forEach(nodeElement => {
        nodeElement.addEventListener("click", async (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          
          // Find the parent node element
          const svgNode = lively.allParents(nodeElement).find(parent => parent.classList.contains("node"));
          if (svgNode) {
            const titleElement = svgNode.querySelector('title');
            if (titleElement) {
              const uuid = titleElement.textContent.trim();
              if (uuid && this._messages.has(uuid)) {
                this.onMessageClick(evt, uuid, this._messages.get(uuid), svgNode);
              }
            }
          }
        });
      });
      
      // Add click handlers to session clusters (using path elements)
      const sessionClusters = this.graphviz.shadowRoot.querySelectorAll("g.cluster path");
      sessionClusters.forEach(pathElement => {
        pathElement.addEventListener("click", async (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          
          // Find the cluster element and extract session ID
          const clusterElement = lively.allParents(pathElement).find(parent => parent.classList.contains("cluster"));
          if (clusterElement) {
            const titleElement = clusterElement.querySelector('title');
            if (titleElement) {
              const clusterTitle = titleElement.textContent.trim();
              
              // Check if this is a session cluster or conversation cluster
              const sessionMatch = clusterTitle.match(/Session ([a-f0-9]{8})/);
              if (sessionMatch) {
                // This is a session cluster
                const sessionId = this.findFullSessionId(sessionMatch[1]);
                if (sessionId) {
                  await this.onSessionClick(evt, sessionId, clusterElement);
                }
              } else if (clusterTitle.startsWith('cluster_conv_')) {
                // This is a conversation cluster
                const convIndex = parseInt(clusterTitle.replace('cluster_conv_', ''));
                if (!isNaN(convIndex) && this._conversations[convIndex]) {
                  await this.onConversationClick(evt, this._conversations[convIndex], clusterElement);
                }
              }
            }
          }
        });
      });
    } catch (error) {
      console.warn('Failed to add click handlers:', error);
    }
  }
  
  getSessionColor(sessionIndex) {
    // Generate different colors for different sessions to show nesting
    const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0', '#fce4ec'];
    return colors[sessionIndex % colors.length];
  }
  
  getConversationDisplayTitle(conversation) {
    // Create a short, readable title with date instead of long first message text
    const date = conversation.latestModificationTime ? 
      new Date(conversation.latestModificationTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: '2-digit'
      }) : 'No date';
    
    // Extract first few words from the original title for context
    let shortTitle = 'Conversation';
    if (conversation.title) {
      // Take first 30 characters and cut at word boundary
      const words = conversation.title.substring(0, 30).split(' ');
      if (words.length > 1) {
        words.pop(); // Remove potentially cut-off last word
      }
      shortTitle = words.join(' ').replace(/[.,:;!?]+$/, ''); // Remove trailing punctuation
      if (shortTitle.length < 5) {
        shortTitle = 'Conversation'; // Fallback if too short
      }
    }
    
    return `${shortTitle} (${date})`;
  }
  
  escapeLabel(label) {
    // Escape special characters for Graphviz labels
    return label.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
  
  findFullSessionId(shortSessionId) {
    // Find the full session ID from the short version (first 8 chars)
    for (const conversation of this._conversations) {
      for (const session of conversation.sessions) {
        if (session.sessionId.startsWith(shortSessionId)) {
          return session.sessionId;
        }
      }
    }
    return null;
  }
  
  findSessionById(sessionId) {
    // Find session metadata by full session ID
    for (const conversation of this._conversations) {
      for (const session of conversation.sessions) {
        if (session.sessionId === sessionId) {
          return session;
        }
      }
    }
    return null;
  }
  
  getSessionMessageCount(sessionId) {
    // Count messages in a specific session
    for (const conversation of this._conversations) {
      if (conversation.sessionMessages && conversation.sessionMessages.has(sessionId)) {
        return conversation.sessionMessages.get(sessionId).size;
      }
    }
    return 0;
  }
  
  findConversationBySessionId(sessionId) {
    // Find which conversation contains a session
    for (const conversation of this._conversations) {
      if (conversation.sessions && conversation.sessions.some(session => session.sessionId === sessionId)) {
        return conversation;
      }
    }
    return null;
  }
  
  getConversationMessageCount(conversation) {
    // Count total unique messages in a conversation
    if (!conversation.sessionMessages) return 0;
    const allMessages = new Set();
    conversation.sessionMessages.forEach(messageSet => {
      messageSet.forEach(uuid => allMessages.add(uuid));
    });
    return allMessages.size;
  }
  
  getConversationDateRange(conversation) {
    // Get formatted date range for a conversation
    if (!conversation.sessions || conversation.sessions.length === 0) return 'No dates';
    
    const dates = conversation.sessions.map(s => new Date(s.modified)).sort();
    const start = dates[0].toLocaleDateString();
    const end = dates[dates.length - 1].toLocaleDateString();
    
    return start === end ? start : `${start} - ${end}`;
  }
  
  formatFileSize(bytes) {
    // Format file size in human readable format
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  positionDetailsPanel(evt, clusterElement) {
    // Position details panel near the clicked cluster element
    if (clusterElement && this.pane) {
      try {
        // Get positions using lively.getClientPosition
        const clusterPos = lively.getClientPosition(clusterElement);
        const panePos = lively.getClientPosition(this.pane);
        
        // Calculate relative position: cluster relative to pane + offset
        const offset = lively.pt(10, 25); // Right 10px, down 25px from the cluster
        const detailsPos = clusterPos.subPt(panePos).addPt(offset);
        
        // Position the details panel
        this.details.style.left = detailsPos.x + 'px';
        this.details.style.top = detailsPos.y + 'px';
      } catch (error) {
        console.warn('Failed to position details panel:', error);
        // Fallback positioning
        this.details.style.left = '20px';
        this.details.style.top = '20px';
      }
    } else {
      // Fallback positioning if no cluster or pane reference
      this.details.style.left = '20px';
      this.details.style.top = '20px';
    }
  }
  
  findExistingSessionViewer(sessionPath) {
    // Look for all lively-claude-session components in the document
    const sessionViewers = document.querySelectorAll('lively-claude-session');
    
    for (let viewer of sessionViewers) {
      const selectedSession = viewer.getAttribute('selected-session');
      if (selectedSession === sessionPath) {
        return viewer;
      }
    }
    
    return null;
  }
  
  async navigateToMessageInExistingViewer(sessionPath, messageUuid) {
    try {
      // Check if there's already a session viewer with this session open
      const existingViewer = this.findExistingSessionViewer(sessionPath);
      
      if (!existingViewer) {
        lively.notify("Please open the session viewer first, then try again");
        return;
      }
      
      // Bring the existing window to front
      if (existingViewer.parentElement && existingViewer.parentElement.classList.contains('lively-window')) {
        const window = existingViewer.parentElement;
        window.style.zIndex = '1000';
        window.focus();
      }
      
      // Use the session viewer's public showMessage method to handle shadow DOM properly
      if (existingViewer.showMessage) {
        const success = existingViewer.showMessage(messageUuid);
        if (!success) {
          lively.notify(`Message ${messageUuid.substring(0, 8)}... not found in session viewer`);
        } else {
          lively.notify(`Navigated to message ${messageUuid.substring(0, 8)}...`);
          // Hide the details panel after successful navigation
          this.details.style.display = 'none';
        }
      } else {
        lively.notify(`Please refresh the session viewer to enable message navigation`);
      }
      
    } catch (error) {
      console.error('Failed to navigate to message:', error);
      lively.notify(`Failed to navigate to message: ${error.message}`);
    }
  }
  
  async onSessionClick(evt, sessionId, clusterElement) {
    // Show session details with action buttons instead of directly opening component
    const session = this.findSessionById(sessionId);
    if (!session) {
      lively.notify('Session not found');
      return;
    }
    
    const sessionMessages = this.getSessionMessageCount(sessionId);
    const conversation = this.findConversationBySessionId(sessionId);
    
    // Create session details content using JSX
    const openSessionBtn = <button style="padding: 8px 12px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;">Open Session</button>;
    openSessionBtn.addEventListener('click', async () => {
      try {
        const sessionComponent = await lively.openComponentInWindow('lively-claude-session');
        // Wait a moment for component initialization
        await lively.sleep(100);
        
        // Set the session path attribute and load the session using the file path
        if (sessionComponent && sessionComponent.loadSession) {
          sessionComponent.setAttribute('selected-session', session.path);
          await sessionComponent.loadSession(session.path);
          lively.notify(`Opened session: ${sessionId.substring(0, 8)}`);
        } else {
          lively.notify(`Opened session component - please load session manually: ${sessionId.substring(0, 8)}`);
        }
      } catch (error) {
        console.error('Failed to open session component:', error);
        lively.notify(`Failed to open session: ${error.message}`);
      }
    });
    
    const closeBtn = <button style="padding: 8px 12px; background: #ddd; color: black; border: none; border-radius: 3px; cursor: pointer;">Close</button>;
    closeBtn.addEventListener('click', () => {
      this.details.style.display = 'none';
    });
    
    const sessionDetails = <div>
      <h3>Session Details</h3>
      <div><strong>Session ID:</strong> {sessionId.substring(0, 12)}...</div>
      <div><strong>Date:</strong> {new Date(session.modified).toLocaleString()}</div>
      <div><strong>Messages:</strong> {sessionMessages} messages</div>
      <div><strong>Conversation:</strong> {conversation ? this.getConversationDisplayTitle(conversation) : 'Unknown'}</div>
      <div><strong>File Size:</strong> {this.formatFileSize(session.sizeBytes || 0)}</div>
      <div style="margin-top: 15px;"><strong>Actions:</strong></div>
      <div style="display: flex; gap: 10px; margin-top: 10px;">
        {openSessionBtn}
        {closeBtn}
      </div>
    </div>;
    
    this.details.innerHTML = '';
    this.details.appendChild(sessionDetails);
    
    // Position the details panel near the clicked cluster
    this.positionDetailsPanel(evt, clusterElement);
    
    // Show the details pane
    this.details.style.display = 'block';
  }
  
  async onConversationClick(evt, conversation, clusterElement) {
    // Show conversation details with action buttons
    const totalMessages = this.getConversationMessageCount(conversation);
    const sessionCount = conversation.sessions ? conversation.sessions.length : 0;
    const dateRange = this.getConversationDateRange(conversation);
    
    // Create conversation details content using JSX
    const openLatestSessionBtn = <button style="padding: 8px 12px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;">Open Latest Session</button>;
    openLatestSessionBtn.addEventListener('click', async () => {
      const conv = this._conversations.find(c => c.conversationId === conversation.conversationId);
      if (conv && conv.sessions && conv.sessions.length > 0) {
        // Find the latest session (by modification time)
        const latestSession = conv.sessions.reduce((latest, session) => 
          new Date(session.modified) > new Date(latest.modified) ? session : latest
        );
        
        try {
          const sessionComponent = await lively.openComponentInWindow('lively-claude-session');
          // Wait a moment for component initialization
          await lively.sleep(100);
          
          // Set the session path attribute and load the session using the file path
          if (sessionComponent && sessionComponent.loadSession) {
            sessionComponent.setAttribute('selected-session', latestSession.path);
            await sessionComponent.loadSession(latestSession.path);
            lively.notify(`Opened latest session: ${latestSession.sessionId.substring(0, 8)}`);
          } else {
            lively.notify(`Opened session component - please load session manually: ${latestSession.sessionId.substring(0, 8)}`);
          }
        } catch (error) {
          console.error('Failed to open latest session:', error);
          lively.notify(`Failed to open session: ${error.message}`);
        }
      } else {
        lively.notify('No sessions found in this conversation');
      }
    });
    
    const closeBtn = <button style="padding: 8px 12px; background: #ddd; color: black; border: none; border-radius: 3px; cursor: pointer;">Close</button>;
    closeBtn.addEventListener('click', () => {
      this.details.style.display = 'none';
    });
    
    // Create session list
    const sessionList = <div style="max-height: 100px; overflow-y: auto; margin-top: 5px; padding: 5px; background: #f9f9f9; border-radius: 3px;">
      {conversation.sessions ? conversation.sessions.map((session, idx) => 
        <div style="margin: 2px 0;"><strong>{idx + 1}.</strong> {session.sessionId.substring(0, 8)} ({new Date(session.modified).toLocaleDateString()})</div>
      ) : <div>No sessions</div>}
    </div>;
    
    const conversationDetails = <div>
      <h3>Conversation Details</h3>
      <div><strong>Title:</strong> {conversation.title ? conversation.title.substring(0, 60) + '...' : 'No title'}</div>
      <div><strong>Conversation ID:</strong> {conversation.conversationId?.substring(0, 12)}...</div>
      <div><strong>Sessions:</strong> {sessionCount} sessions</div>
      <div><strong>Total Messages:</strong> {totalMessages} messages</div>
      <div><strong>Date Range:</strong> {dateRange}</div>
      <div><strong>Last Modified:</strong> {conversation.latestModificationTime ? new Date(conversation.latestModificationTime).toLocaleString() : 'Unknown'}</div>
      <div style="margin-top: 15px;"><strong>Sessions in this conversation:</strong></div>
      {sessionList}
      <div style="margin-top: 15px;"><strong>Actions:</strong></div>
      <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
        {openLatestSessionBtn}
        {closeBtn}
      </div>
    </div>;
    
    this.details.innerHTML = '';
    this.details.appendChild(conversationDetails);
    
    // Position the details panel near the clicked cluster
    this.positionDetailsPanel(evt, clusterElement);
    
    // Show the details pane
    this.details.style.display = 'block';
  }
  
  onMessageClick(evt, uuid, message, svgNode) {
    // Show message details in the details pane positioned under the clicked message
    const role = message.role || 'unknown';
    const sessionId = message.sessionId ? message.sessionId.substring(0, 8) : 'unknown';
    const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : 'no timestamp';
    const hasParent = message.parentUuid ? 'Yes' : 'No';
    const conversationTitle = message.conversationTitle ? message.conversationTitle.substring(0, 40) + '...' : 'Unknown';
    
    const content = message.message?.content;
    let preview = '';
    if (content) {
      if (Array.isArray(content) && content.length > 0 && content[0].text) {
        preview = content[0].text.substring(0, 300) + (content[0].text.length > 300 ? '...' : '');
      } else if (typeof content === 'string') {
        preview = content.substring(0, 300) + (content.length > 300 ? '...' : '');
      }
    }
    
    // Create message details content using JSX
    const goToMessageBtn = <button style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;">Go to Message</button>;
    goToMessageBtn.addEventListener('click', async () => {
      await this.navigateToMessageInExistingViewer(message.sessionPath, uuid);
    });
    
    const closeBtn = <button style="padding: 8px 12px; background: #ddd; color: black; border: none; border-radius: 3px; cursor: pointer;">Close</button>;
    closeBtn.addEventListener('click', () => {
      this.details.style.display = 'none';
    });
    
    const messageDetails = <div>
      <h3>Message Details</h3>
      <div><strong>UUID:</strong> {uuid.substring(0, 8)}...</div>
      <div><strong>Role:</strong> {role}</div>
      <div><strong>Session:</strong> {sessionId}</div>
      <div><strong>Conversation:</strong> {conversationTitle}</div>
      <div><strong>Has Parent:</strong> {hasParent}</div>
      <div><strong>Timestamp:</strong> {timestamp}</div>
      <div style="margin-top: 10px;"><strong>Content Preview:</strong></div>
      <div style="background: #f9f9f9; padding: 8px; border-radius: 3px; font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 150px; overflow-y: auto;">{preview || 'No content available'}</div>
      <div style="margin-top: 15px;"><strong>Actions:</strong></div>
      <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
        {goToMessageBtn}
        {closeBtn}
      </div>
    </div>;
    
    this.details.innerHTML = '';
    this.details.appendChild(messageDetails);
    
    // Position the details panel under the clicked message (following literature-graph pattern)
    if (svgNode && this.pane) {
      try {
        // Get positions using lively.getClientPosition
        const nodePos = lively.getClientPosition(svgNode);
        const panePos = lively.getClientPosition(this.pane);
        
        // Calculate relative position: node relative to pane + offset
        const offset = lively.pt(10, 25); // Right 10px, down 25px from the node
        const detailsPos = nodePos.subPt(panePos).addPt(offset);
        
        // Position the details panel
        this.details.style.left = detailsPos.x + 'px';
        this.details.style.top = detailsPos.y + 'px';
      } catch (error) {
        console.warn('Failed to position details panel:', error);
        // Fallback positioning
        this.details.style.left = '20px';
        this.details.style.top = '20px';
      }
    } else {
      // Fallback positioning if no node or pane reference
      this.details.style.left = '20px';
      this.details.style.top = '20px';
    }
    
    // Show the details pane
    this.details.style.display = 'block';
  }
  
  
  
  updateStats() {
    if (!this.stats) return;
    
    this.messageCount.textContent = `Messages: ${this._messages.size}`;
    this.sessionCount.textContent = `Sessions: ${this._sessions.length}`;
    this.conversationCount.textContent = `Conversations: ${this._conversations.length}`;
    
    this.stats.style.display = 'flex';
  }
  
  showLoading() {
    if (this.loading) {
      this.loading.style.display = 'block';
    }
    this.get("#content").innerHTML = '';
  }
  
  hideLoading() {
    if (this.loading) {
      this.loading.style.display = 'none';
    }
  }
  
  showError(message) {
    this.hideLoading();
    this.get("#content").innerHTML = `<div class="error-message">${message}</div>`;
  }
  
  livelyExample() {
    // Example usage - could be extended to show sample data
  }
  
  livelyMigrate(other) {
    // Migrate data structures
    this._availableProjects = other._availableProjects;
    this._currentProject = other._currentProject;
    this._messages = other._messages || new Map();
    this._sessions = other._sessions || [];
    this._conversations = other._conversations || [];
    
    // Preserve zoom level from previous instance
    if (other.zooming) {
      this._zoomLevel = other.zooming.getZoom();
    }
  }
}