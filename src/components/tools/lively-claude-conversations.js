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
      
      // Build message graph
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
    // Discover all session files
    const sessionFiles = await ClaudeSessions.discoverSessions(this._currentProject);
    this._sessions = sessionFiles;
    
    // Clear previous data
    this._messages.clear();
    
    // Load all messages from all sessions
    for (const sessionFile of sessionFiles) {
      try {
        const messages = await ClaudeSessions.loadSessionContent(sessionFile.path);
        
        messages.forEach(message => {
          if (message.uuid && !this._messages.has(message.uuid)) {
            // Add message with metadata
            this._messages.set(message.uuid, {
              ...message,
              sessionId: sessionFile.sessionId,
              sessionPath: sessionFile.path,
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
  
  buildMessageGraph() {
    // Group messages by conversation (messages with same root)
    const conversationGroups = new Map();
    
    // Find root messages (no parent) and build conversation trees
    this._messages.forEach((message, uuid) => {
      if (!message.parentUuid) {
        // This is a root message - start a new conversation
        conversationGroups.set(uuid, {
          rootUuid: uuid,
          messages: new Set([uuid])
        });
      }
    });
    
    // Add child messages to their conversation groups
    this._messages.forEach((message, uuid) => {
      if (message.parentUuid) {
        // Find which conversation this message belongs to by traversing up the parent chain
        const conversationRoot = this.findConversationRoot(message.parentUuid);
        if (conversationRoot && conversationGroups.has(conversationRoot)) {
          conversationGroups.get(conversationRoot).messages.add(uuid);
        } else {
          // Orphaned message - create its own conversation
          conversationGroups.set(uuid, {
            rootUuid: uuid,
            messages: new Set([uuid])
          });
        }
      }
    });
    
    this._conversations = Array.from(conversationGroups.values());
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
    
    this.details = <div class="details" style="position:absolute; display: none"></div>;
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
    
    // Group messages by conversation and create subgraphs with boxes
    this._conversations.forEach((conversation, index) => {
      dot += `  subgraph cluster_${index} {\n`;
      dot += `    label="Conversation ${index + 1}";\n`;
      dot += `    style="rounded,filled";\n`;
      dot += `    fillcolor="lightgray";\n`;
      dot += `    color="gray";\n`;
      dot += `    penwidth=2;\n`;
      
      // Add nodes for this conversation
      conversation.messages.forEach(messageUuid => {
        if (this._messages.has(messageUuid)) {
          const message = this._messages.get(messageUuid);
          const shortUuid = messageUuid.substring(0, 8);
          const color = this.getMessageColor(message);
          const title = this.getMessageTitle(message);
          
          dot += `    "${messageUuid}" [label="", fillcolor="${color}", style="filled", tooltip="${title}", title="${messageUuid}"];\n`;
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
      // Add click handlers to all SVG text elements in nodes (following literature-graph pattern)
      const allSVGNodes = this.graphviz.shadowRoot.querySelectorAll("g.node text");
      allSVGNodes.forEach(textElement => {
        textElement.addEventListener("click", async (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          
          // Find the parent node element
          const svgNode = lively.allParents(textElement).find(parent => parent.classList.contains("node"));
          if (svgNode) {
            const titleElement = svgNode.querySelector('title');
            if (titleElement) {
              const uuid = titleElement.textContent.trim();
              if (uuid && this._messages.has(uuid)) {
                this.onMessageClick(uuid, this._messages.get(uuid));
              }
            }
          }
        });
      });
    } catch (error) {
      console.warn('Failed to add click handlers to nodes:', error);
    }
  }
  
  onMessageClick(uuid, message) {
    // Show message details in the details pane (following literature-graph pattern)
    const role = message.role || 'unknown';
    const sessionId = message.sessionId ? message.sessionId.substring(0, 8) : 'unknown';
    const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : 'no timestamp';
    const hasParent = message.parentUuid ? 'Yes' : 'No';
    
    const content = message.message?.content;
    let preview = '';
    if (content) {
      if (Array.isArray(content) && content.length > 0 && content[0].text) {
        preview = content[0].text.substring(0, 200) + (content[0].text.length > 200 ? '...' : '');
      } else if (typeof content === 'string') {
        preview = content.substring(0, 200) + (content.length > 200 ? '...' : '');
      }
    }
    
    // Update the details pane content
    this.details.innerHTML = `
      <h3>Message Details</h3>
      <div><strong>UUID:</strong> ${uuid}</div>
      <div><strong>Role:</strong> ${role}</div>
      <div><strong>Session:</strong> ${sessionId}</div>
      <div><strong>Has Parent:</strong> ${hasParent}</div>
      <div><strong>Timestamp:</strong> ${timestamp}</div>
      <div style="margin-top: 10px;"><strong>Content Preview:</strong></div>
      <div style="background: #f9f9f9; padding: 8px; border-radius: 3px; font-family: monospace; font-size: 12px; white-space: pre-wrap;">${preview || 'No content available'}</div>
      <button onclick="this.parentElement.style.display='none'" style="margin-top: 10px; padding: 5px 10px; border: none; background: #ddd; border-radius: 3px; cursor: pointer;">Close</button>
    `;
    
    // Show the details pane
    this.details.style.display = 'block';
    this.details.style.left = '20px';
    this.details.style.top = '20px';
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