import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessions from 'src/client/claude-sessions.js';
import * as d3 from 'src/external/d3.v5.js';

/*MD # Claude Conversations Graph

Visualizes Claude conversation structures as a graph showing how messages connect to each other through parent-child relationships.

- Each message is shown as a circle
- Edges connect child messages to their parents
- Messages with the same UUID are shown only once
- Different colors can represent different roles (user/assistant)

MD*/

export default class LivelyClaudeConversations extends Morph {

  async initialize() {
    this.windowTitle = "Claude Conversations Graph";
    
    // Initialize UI references
    this.projectSelect = this.get("#projectSelect");
    this.loadButton = this.get("#loadButton");
    this.loading = this.get("#loading");
    this.graphContainer = this.get("#graphContainer");
    this.stats = this.get("#stats");
    this.messageCount = this.get("#messageCount");
    this.sessionCount = this.get("#sessionCount");
    this.conversationCount = this.get("#conversationCount");
    
    // Initialize data structures
    this._currentProject = this.getAttribute('selected-project');
    this._availableProjects = this._availableProjects || [];
    this._messages = new Map(); // uuid -> message data
    this._sessions = [];
    this._conversations = [];
    
    this.registerButtons();
    
    // Setup project selector
    this.projectSelect.addEventListener('change', () => {
      this.setAttribute('selected-project', this.projectSelect.value);
      this._currentProject = this.projectSelect.value;
    });
    
    // Load projects
    await this.loadProjects();
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
      this.graphContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">No messages found</div>';
      return;
    }
    
    // Create Graphviz DOT notation
    let dot = 'digraph ConversationGraph {\n';
    dot += '  rankdir=TB;\n'; // Top to bottom layout
    dot += '  node [shape=circle, width=0.3, height=0.3];\n';
    dot += '  edge [arrowsize=0.5];\n';
    
    // Add nodes (messages)
    this._messages.forEach((message, uuid) => {
      const shortUuid = uuid.substring(0, 8);
      const color = this.getMessageColor(message);
      const title = this.getMessageTitle(message);
      
      dot += `  "${uuid}" [label="", fillcolor="${color}", style="filled", tooltip="${title}", title="${uuid}"];\n`;
    });
    
    // Add edges (parent-child relationships)
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
      // Clear container
      this.graphContainer.innerHTML = '';
      
      // Create and configure graphviz-dot component
      this.graphviz = await (<graphviz-dot server="false"></graphviz-dot>);
      this.graphviz.style.width = '100%';
      this.graphviz.style.height = '100%';
      this.graphviz.style.display = 'inline-block';
      
      // Add click handler for messages
      this.graphviz.addEventListener("click", async (evt) => {
        const nodeElement = evt.path.find(ea => ea.classList && ea.classList.contains("node"));
        if (nodeElement) {
          const messageId = nodeElement.getAttribute("data-uuid");
          if (messageId && this._messages.has(messageId)) {
            this.onMessageClick(messageId, this._messages.get(messageId));
          }
        }
      });
      
      // Set the DOT content and render
      this.graphviz.innerHTML = `<script type="graphviz">${dot}</script>`;
      this.graphviz.setAttribute("engine", "dot");
      
      this.graphContainer.appendChild(this.graphviz);
      
      await this.graphviz.updateViz();
      
      // Add UUID data attributes to nodes for click handling
      this.addNodeDataAttributes();
      
    } catch (error) {
      console.error('Failed to render graph with graphviz-dot:', error);
      this.renderSimpleGraph();
    }
  }
  
  addNodeDataAttributes() {
    try {
      // Add data attributes to SVG nodes for easier click handling
      const svgNodes = this.graphviz.shadowRoot.querySelectorAll("g.node");
      svgNodes.forEach(node => {
        const titleElement = node.querySelector("title");
        if (titleElement) {
          const uuid = titleElement.textContent.trim();
          if (uuid && this._messages.has(uuid)) {
            node.setAttribute("data-uuid", uuid);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to add data attributes to nodes:', error);
    }
  }
  
  onMessageClick(uuid, message) {
    // Show message details
    const role = message.role || 'unknown';
    const sessionId = message.sessionId ? message.sessionId.substring(0, 8) : 'unknown';
    const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : 'no timestamp';
    const hasParent = message.parentUuid ? 'Yes' : 'No';
    
    const content = message.message?.content;
    let preview = '';
    if (content) {
      if (Array.isArray(content) && content.length > 0 && content[0].text) {
        preview = content[0].text.substring(0, 100) + (content[0].text.length > 100 ? '...' : '');
      } else if (typeof content === 'string') {
        preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
      }
    }
    
    lively.notify(`Message: ${uuid.substring(0, 8)}
Role: ${role}
Session: ${sessionId}
Has Parent: ${hasParent}
Time: ${timestamp}
Preview: ${preview}`, 'Message Details', 10000);
  }
  
  
  renderSimpleGraph() {
    // Simple fallback layout using D3
    this.graphContainer.innerHTML = '';
    
    const width = this.graphContainer.clientWidth || 800;
    const height = this.graphContainer.clientHeight || 600;
    
    const svg = d3.select(this.graphContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create nodes and links data for D3
    const nodes = Array.from(this._messages.entries()).map(([uuid, message]) => ({
      id: uuid,
      message: message,
      color: this.getMessageColor(message)
    }));
    
    const links = [];
    this._messages.forEach((message, uuid) => {
      if (message.parentUuid && this._messages.has(message.parentUuid)) {
        links.push({
          source: message.parentUuid,
          target: uuid
        });
      }
    });
    
    // Simple force-directed layout
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Add links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 1);
    
    // Add nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 8)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    // Add tooltips
    node.append('title')
      .text(d => `${d.id.substring(0, 8)}\nRole: ${d.message.role || 'unknown'}`);
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });
  }
  
  updateStats() {
    if (!this.stats) return;
    
    this.messageCount.textContent = `Messages: ${this._messages.size}`;
    this.sessionCount.textContent = `Sessions: ${this._sessions.length}`;
    this.conversationCount.textContent = `Conversations: ${this._conversations.length}`;
    
    this.stats.style.display = 'flex';
  }
  
  showLoading() {
    this.loading.style.display = 'block';
    this.graphContainer.innerHTML = '';
  }
  
  hideLoading() {
    this.loading.style.display = 'none';
  }
  
  showError(message) {
    this.hideLoading();
    this.graphContainer.innerHTML = `<div class="error-message">${message}</div>`;
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
  }
}