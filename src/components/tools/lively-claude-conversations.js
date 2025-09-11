import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessions, { 
  ClaudeConversation, 
  ClaudeMessage, 
  ClaudeUserMessage, 
  ClaudeAgentMessage, 
  ClaudeToolCall, 
  ClaudeToolResponse 
} from 'src/client/claude-sessions.js';
import ClaudeMessageColors from 'src/client/claude-message-colors.js';
import { Panning, Zooming } from "src/client/html.js"
/*MD # Claude Conversations Graph

Visualizes Claude conversation structures as a graph showing how messages connect to each other through parent-child relationships.

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
    this._conversationsData = this._conversationsData || [];
    this._currentlyOpenMessage = this._currentlyOpenMessage || null; // Track currently open message for toggle
    
    this.registerButtons();
    
    // Setup project selector
    this.projectSelect.addEventListener('change', () => {
      this.setAttribute('selected-project', this.projectSelect.value);
      this._currentProject = this.projectSelect.value;
    });
    
    // Load projects
    if (this._conversationsData.length == 0) {
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
      // Load conversations with automatic deduplication
      await this.loadConversations();
      
      // Render the simple graph directly
      await this.renderGraph();
      
      // Update stats
      this.updateStats();
      
    } catch (error) {
      this.showError(`Failed to load conversations: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }
  
  async loadConversations() {
    this._conversationsData = await ClaudeSessions.discoverConversations(this._currentProject);
    
    this._claudeConversations = new Map();
    this._messages.clear();
    
    for (const conversationData of this._conversationsData) {
      const sessionDataArray = [];
      for (const sessionFile of conversationData.sessions) {
        try {
          const rawMessages = await ClaudeSessions.loadSessionContent(sessionFile.path);
          sessionDataArray.push({
            sessionId: sessionFile.sessionId,
            rawMessages: rawMessages
          });
        } catch (error) {
          console.warn(`Failed to load session ${sessionFile.path}:`, error);
        }
      }
      
      const claudeConversation = ClaudeConversation.fromMultipleSessions(
        sessionDataArray, 
        conversationData.conversationId
      );
      
      this._claudeConversations.set(conversationData.conversationId, {
        claudeConversation,
        title: conversationData.title,
        latestDate: conversationData.latestModificationTime
      });
      
      claudeConversation.messages.forEach(message => {
        if (message.uuid) {
          this._messages.set(message.uuid, message);
        }
      });
    }
  }
  
  getMessageIcon(message) {
    if (message instanceof ClaudeUserMessage) {
      return message.isToolResponse ? '📋' : '👤'; // Tool result or User
    } else if (message instanceof ClaudeAgentMessage) {
      return message.hasToolCalls ? '🔧' : '🤖'; // Tool use or Assistant
    } else {
      switch (message.role) {
        case 'user': return '👤';
        case 'assistant': return '🤖';
        case 'system': return '⚙️';
        default: return '❓';
      }
    }
  }
  
  getConversationTitle(conversationData) {
    // Create short, readable title
    const date = conversationData.latestDate ? 
      new Date(conversationData.latestDate).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: '2-digit'
      }) : 'No date';

    return `${date}`;
  }

  // #important
  async renderGraph() {
    debugger
    if (this._messages.size === 0) {
      this.get("#content").innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">No messages found</div>';
      return;
    }
    
    // Set up basic pane structure
    this.get("#content").innerHTML = "";
    this.details = <div class="details" style="position:absolute; display: none; z-index: 1000; background: #FBFBFB; padding: 10px; border: 1px solid gray; border-radius: 5px; max-width: 400px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"></div>;
    this.pane = <div id="root">{this.details}</div>;
    this.get("#content").appendChild(this.pane);
    
    // Initialize panning
    new Panning(this.pane);
    
    // Generate simple DOT graph
    let dot = 'digraph ConversationGraph {\n';
    dot += '  fontname="Arial";\n';
    dot += '  rankdir=TB;\n';
    dot += '  ranksep=0.4;\n';
    dot += '  nodesep=0.3;\n';
    dot += '  node [shape=circle, width=0.3, height=0.3, fontsize=12, fontname="Arial"];\n';
    dot += '  edge [arrowsize=0.3, fontname="Arial"];\n';
    
    let conversationIndex = 0;
    for (const [conversationId, conversationData] of this._claudeConversations) {
      const { claudeConversation, title, latestDate } = conversationData;
      
      if (claudeConversation.messages.length === 0) continue;
      
      // Simple conversation cluster
      dot += `  subgraph cluster_${conversationIndex} {\n`;
      dot += `    label="${this.escapeLabel(this.getConversationTitle({ title, latestDate }))}";\n`;
      dot += `    style="rounded,filled";\n`;
      dot += `    fillcolor="#f8f9fa";\n`;
      dot += `    color="#666";\n`;
      
      // Add all messages as simple nodes
      claudeConversation.messages.forEach(message => {
        const color = ClaudeMessageColors.getGraphvizColor(message);
        const icon = this.getMessageIcon(message);
        const title = `${message.role} - ${message.uuid.substring(0, 8)}`;
        
        dot += `    "${message.uuid}" [label="X", fillcolor="${color}", style="filled", tooltip="${title}", title="${message.uuid}"];\n`;
      });
      
      // Add edges based on parent relationships
      claudeConversation.messages.forEach(message => {
        if (message.parentUuid) {
          // Check if parent exists in this conversation
          const parentExists = claudeConversation.messages.some(m => m.uuid === message.parentUuid);
          if (parentExists) {
            dot += `    "${message.parentUuid}" -> "${message.uuid}";\n`;
          }
        }
      });
      
      dot += `  }\n`;
      conversationIndex++;
    }
    
    dot += '}';
    
    // Render with Graphviz
    await this.renderDotGraph(dot);
  }
  
  escapeLabel(label) {
    return label.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
  
  
  async renderDotGraph(dot) {
    try {
      // Create graphviz component
      this.graphviz = await (<graphviz-dot server="true"></graphviz-dot>);
      this.graphviz.style.display = 'inline-block';
      
      // Set DOT content and render
      this.graphviz.innerHTML = `<script type="graphviz">${dot}</script>`;
      this.graphviz.setAttribute("engine", "dot");
      
      this.pane.appendChild(this.graphviz);
      await this.graphviz.updateViz();
      
      // Initialize zooming
      this.zooming = new Zooming(this.graphviz, {
        minZoom: 0.1,
        maxZoom: 5.0,
        zoomStep: 0.1,
        transformOrigin: 'top left'
      });
      
      this.addClickHandlers();
      this.patchMessageIcons();
      
    } catch (error) {
      console.error('Failed to render graph:', error);
      this.showError(`Failed to render graph: ${error.message}`);
    }
  }
  
  addClickHandlers() {
    const messageNodes = this.graphviz.shadowRoot.querySelectorAll("g.node");
    messageNodes.forEach(nodeElement => {
      nodeElement.addEventListener("click", async (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        
        const titleElement = nodeElement.querySelector('title');
        if (titleElement) {
          const uuid = titleElement.textContent.trim();
          const message = this._messages.get(uuid);
          if (message) {
            this.onMessageClick(evt, uuid, message, nodeElement);
          }
        }
      });
    });
  }
  
  patchMessageIcons() {
    // Replace placeholder "X" labels with message icons
    if (!this.graphviz || !this.graphviz.shadowRoot) return;
    
    const nodeGroups = this.graphviz.shadowRoot.querySelectorAll("g.node");
    nodeGroups.forEach(nodeGroup => {
      const titleElement = nodeGroup.querySelector('title');
      if (!titleElement) return;
      
      const uuid = titleElement.textContent.trim();
      const message = this._messages.get(uuid);
      if (message) {
        const textElement = nodeGroup.querySelector('text');
        if (textElement && textElement.textContent === 'X') {
          textElement.textContent = this.getMessageIcon(message);
          textElement.setAttribute('font-size', '14');
          textElement.setAttribute('font-family', 'Arial, sans-serif');
          textElement.setAttribute('fill', '#333');
        }
      }
    });
  }
  
  onMessageClick(evt, uuid, message, svgNode) {
    // Simple message details popup
    const role = message.role || 'unknown';
    const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : 'no timestamp';
    const hasParent = message.parentUuid ? 'Yes' : 'No';
    
    // Get text content preview
    let preview = '';
    if (message instanceof ClaudeMessage) {
      preview = message.getTextContent();
    }
    if (preview.length > 200) {
      preview = preview.substring(0, 200) + '...';
    }
    
    // Create simple details popup
    const inspectorBtn = <button style="padding: 6px 10px; background: #ffc107; color: black; border: none; border-radius: 3px; cursor: pointer;">Inspect</button>;
    inspectorBtn.addEventListener('click', () => {
      lively.openInspector(message, null, "Message Data");
      this.details.style.display = 'none';
    });
    
    const closeBtn = <button style="padding: 6px 10px; background: #ddd; color: black; border: none; border-radius: 3px; cursor: pointer;">Close</button>;
    closeBtn.addEventListener('click', () => {
      this.details.style.display = 'none';
    });
    
    const messageDetails = <div>
      <h4>Message Details</h4>
      <div><strong>UUID:</strong> {uuid.substring(0, 12)}...</div>
      <div><strong>Role:</strong> {role}</div>
      <div><strong>Has Parent:</strong> {hasParent}</div>
      <div><strong>Timestamp:</strong> {timestamp}</div>
      {preview && <div>
        <div style="margin-top: 10px;"><strong>Content:</strong></div>
        <div style="background: #f9f9f9; padding: 6px; border-radius: 3px; font-family: monospace; font-size: 11px; white-space: pre-wrap; max-height: 100px; overflow-y: auto;">{preview}</div>
      </div>}
      <div style="display: flex; gap: 8px; margin-top: 10px;">
        {inspectorBtn}
        {closeBtn}
      </div>
    </div>;
    
    this.details.innerHTML = '';
    this.details.appendChild(messageDetails);
    
    // Position near clicked node
    if (svgNode) {
      try {
        const nodePos = lively.getClientPosition(svgNode);
        const detailsPos = nodePos.addPt(lively.pt(50, 20));
        lively.setClientPosition(this.details, detailsPos);
      } catch (error) {
        lively.setClientPosition(this.details, lively.pt(20, 20));
      }
    }
    
    this.details.style.display = 'block';
  }
  
  
  // Simple utility methods
  updateStats() {
    if (!this.stats) return;
    
    this.messageCount.textContent = `Messages: ${this._messages.size}`;
    this.conversationCount.textContent = `Conversations: ${this._claudeConversations.size}`;
    
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
    // Set example project if available
  }
  
  livelyMigrate(other) {
    // Migrate data from previous instance
    this._availableProjects = other._availableProjects;
    this._currentProject = other._currentProject;
    this._claudeConversations = other._claudeConversations || new Map();
    this._conversationsData = other._conversationsData || [];
    this._messages = other._messages || new Map();
    
    // Preserve zoom level
    if (other.zooming) {
      this._zoomLevel = other.zooming.getZoom();
    }
  }
}
