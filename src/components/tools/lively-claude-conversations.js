import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessions from 'src/client/claude-sessions.js';
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
    this._conversations = this._conversations || [];
    this._currentlyOpenMessage = this._currentlyOpenMessage || null; // Track currently open message for toggle
    
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
      
      // Render the graph using new clean rendering data
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
            if (message.uuid) {
              if (!this._messages.has(message.uuid)) {
                // Add message with metadata
                this._messages.set(message.uuid, {
                  ...message,
                  sessionId: sessionFile.sessionId,
                  sessionPath: sessionFile.path,
                  conversationId: conversation.conversationId,
                  conversationTitle: conversation.title,
                  role: message.message?.role || message.role || 'unknown',
                  isUserMessage: message.type === 'user' && !message.toolUseResult,
                  _sessions: [sessionFile.sessionId] // Initialize sessions array
                });
              } else {
                // Message already exists, add this session to its sessions array
                const existingMessage = this._messages.get(message.uuid);
                if (!existingMessage._sessions.includes(sessionFile.sessionId)) {
                  existingMessage._sessions.push(sessionFile.sessionId);
                }
              }
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
      
      // Add messages to their respective sessions using the _sessions array
      this._messages.forEach((message, uuid) => {
        if (message.conversationId === conversation.conversationId && message._sessions) {
          // Add message to all sessions it belongs to
          message._sessions.forEach(sessionId => {
            const sessionMessages = conversation.sessionMessages.get(sessionId);
            if (sessionMessages) {
              sessionMessages.add(uuid);
            }
          });
        }
      });
      
      // Note: No longer calling processToolGroupings here - will be handled in rendering data
    });
  }
  
  buildRenderingData(conversation) {
    // Create clean rendering data structure for graphviz (detailed view only)
    return this.buildDetailedRenderingData(conversation);
  }
  
  buildDetailedRenderingData(conversation) {
    // Detailed view: all messages as individual nodes with original relationships
    const renderingNodes = [];
    const renderingEdges = [];
    
    // Get all messages for this conversation
    const conversationMessages = [];
    this._messages.forEach((message, uuid) => {
      if (message.conversationId === conversation.conversationId) {
        conversationMessages.push(message);
      }
    });
    
    // Create rendering nodes (one per message)
    conversationMessages.forEach(message => {
      renderingNodes.push({
        id: message.uuid,
        type: 'message',
        originalMessage: message, // Reference back to original data
        sessionId: message.sessionId,
        parentId: message.parentUuid // Will be used for edges
      });
    });
    
    // Create rendering edges based on parent relationships
    renderingNodes.forEach(node => {
      if (node.parentId) {
        // Only create edge if parent exists in this conversation
        const parentExists = renderingNodes.some(n => n.id === node.parentId);
        if (parentExists) {
          renderingEdges.push({
            from: node.parentId,
            to: node.id
          });
        }
      }
    });
    
    return {
      nodes: renderingNodes,
      edges: renderingEdges,
      sessions: this.buildSessionStructure(conversation, renderingNodes)
    };
  }
  
  buildSessionStructure(conversation, renderingNodes) {
    // Build session structure using actual session membership (no calculations)
    const sessions = [];
    
    conversation.sessions.forEach(session => {
      const sessionMessages = conversation.sessionMessages.get(session.sessionId) || new Set();
      
      // Find rendering nodes that belong to this session (detailed view only - all nodes are messages)
      const sessionNodes = renderingNodes.filter(node => 
        node.type === 'message' && sessionMessages.has(node.id)
      );
      
      sessions.push({
        sessionId: session.sessionId,
        modified: session.modified,
        path: session.path,
        nodeIds: sessionNodes.map(node => node.id),
        messageCount: sessionNodes.length
      });
    });
    
    return sessions;
  }
  
  
  findRenderingParent(originalParentId, renderingNodes, conversationMessages) {
    // Walk up the original parent chain until we find a node that exists in renderingNodes
    const visited = new Set();
    let currentParentId = originalParentId;
    
    while (currentParentId && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      
      // Check if this parent exists in rendering nodes
      const renderingNode = renderingNodes.find(n => n.id === currentParentId);
      if (renderingNode) {
        return renderingNode.id;
      }
      
      // Check if this parent was grouped into an agent activity
      for (const node of renderingNodes) {
        if (node.type === 'agent_activity' && node.originalMessages) {
          if (node.originalMessages.some(msg => msg.uuid === currentParentId)) {
            return node.id;
          }
        }
      }
      
      // Parent not found in rendering, walk up to its parent
      const originalMessage = conversationMessages.find(m => m.uuid === currentParentId);
      if (originalMessage && originalMessage.parentUuid) {
        currentParentId = originalMessage.parentUuid;
      } else {
        break;
      }
    }
    
    return null; // No visible parent found
  }
  
  
  
  getRenderingNodeColor(node) {
    // Get color for rendering node (detailed view only - all nodes are messages)
    if (node.type === 'message' && node.originalMessage) {
      return ClaudeMessageColors.getGraphvizColor(node.originalMessage);
    }
    return '#lightgray'; // Fallback
  }
  
  getRenderingNodeTitle(node) {
    // Get title for rendering node (detailed view only - all nodes are messages)
    if (node.type === 'message' && node.originalMessage) {
      return this.getMessageTitle(node.originalMessage);
    }
    return 'Unknown Node';
  }
  
  
  isToolCallMessage(message) {
    // Check if message is a tool call (assistant making tool calls)
    return message.message?.content && Array.isArray(message.message.content) && 
           message.message.content.some(c => c.type === 'tool_use');
  }
  
  isToolResultMessage(message) {
    // Check if message is a tool result
    return message.toolUseResult || 
           (message.message?.content && Array.isArray(message.message.content) && 
            message.message.content.some(c => c.type === 'tool_result'));
  }
  
  findToolResultForCall(toolCallMessage, conversation) {
    // Find the tool result message that corresponds to a tool call
    // Look for messages in the same conversation that come after the tool call
    let resultMessage = null;
    let minTimeDiff = Infinity;
    
    this._messages.forEach((message, uuid) => {
      if (message.conversationId !== conversation.conversationId) return;
      if (!this.isToolResultMessage(message)) return;
      
      // Check if this result comes after the tool call
      if (message.timestamp && toolCallMessage.timestamp) {
        const timeDiff = new Date(message.timestamp) - new Date(toolCallMessage.timestamp);
        if (timeDiff > 0 && timeDiff < minTimeDiff) {
          // This could be the result - also check if tool IDs match if available
          if (this.toolIdsMatch(toolCallMessage, message)) {
            resultMessage = message;
            minTimeDiff = timeDiff;
          }
        }
      }
    });
    
    return resultMessage;
  }
  
  toolIdsMatch(toolCallMessage, toolResultMessage) {
    // Try to match tool IDs between call and result
    if (!toolCallMessage.message?.content || !toolResultMessage.message?.content) {
      return true; // Default to true if we can't check IDs
    }
    
    const toolCall = toolCallMessage.message.content.find(c => c.type === 'tool_use');
    const toolResult = toolResultMessage.message.content.find(c => c.type === 'tool_result');
    
    if (toolCall && toolResult && toolCall.id && toolResult.tool_use_id) {
      return toolCall.id === toolResult.tool_use_id;
    }
    
    return true; // Default to true if IDs not available
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
  
  // Legacy method removed - functionality moved to buildCondensedRenderingData
  
  isUserMessage(message) {
    // Determine if a message is from the user
    return message.role === 'user' || message.isUserMessage || message.type === 'user';
  }
  
  isAgentMessage(message) {
    // Determine if a message is part of agent activity (assistant, tool calls, tool results)
    return message.role === 'assistant' || 
           message.role === 'tool_use' || 
           message.role === 'tool_result' ||
           message.toolUseResult || // Claude Code specific tool result format
           this.isToolCallMessage(message) ||
           this.isToolResultMessage(message);
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
    
    // Create Graphviz DOT notation using new clean rendering data
    let dot = 'digraph ConversationGraph {\n';
    dot += '  rankdir=TB;\n'; // Top to bottom layout
    dot += '  ranksep=0.3;\n'; // Minimum separation between ranks (vertical spacing)
    dot += '  nodesep=0.2;\n'; // Minimum separation between nodes (horizontal spacing)
    dot += '  node [shape=circle, width=0.1, height=0.1];\n';
    dot += '  edge [arrowsize=0.2, minlen=1];\n';
    
    // Create nested subgraphs: conversations contain sessions, sessions contain messages
    this._conversations.forEach((conversation, convIndex) => {
      // Build clean rendering data for this conversation
      const renderingData = this.buildRenderingData(conversation);
      
      // Store rendering data for click handlers
      conversation._renderingData = renderingData;
      // Main conversation cluster
      dot += `  subgraph cluster_conv_${convIndex} {\n`;
      dot += `    label="${this.escapeLabel(this.getConversationDisplayTitle(conversation))}";\n`;
      dot += `    style="rounded,filled";\n`;
      dot += `    fillcolor="#f0f0f0";\n`;
      dot += `    color="#666";\n`;
      dot += `    penwidth=2;\n`;
      
      // Create session clusters using actual session membership (no complex calculations)
      renderingData.sessions.forEach((session, sessionIndex) => {
        if (session.nodeIds.length > 0) {
          // Session subcluster with actual message count
          dot += `    subgraph cluster_sess_${convIndex}_${sessionIndex} {\n`;
          dot += `    label="Session ${session.sessionId.substring(0, 8)} (${new Date(session.modified).toLocaleDateString()}) - ${session.messageCount} msgs";\n`;
          dot += `    style="rounded,filled";\n`;
          dot += `    fillcolor="${this.getSessionColor(sessionIndex)}";\n`;
          dot += `    color="#333";\n`;
          dot += `    penwidth=1;\n`;
          dot += `    sessionId="${session.sessionId}";\n`; // Custom attribute for click detection
        }
      });
      
      // Add nodes from rendering data
      renderingData.nodes.forEach(node => {
        const color = this.getRenderingNodeColor(node);
        const title = this.getRenderingNodeTitle(node);
        const label = this.getMessageLabel(node); // Reuse existing label logic
        
        dot += `      "${node.id}" [label="${label}", fillcolor="${color}", style="filled", tooltip="${title}", title="${node.id}"];\n`;
      });
      
      // Close all session subclusters
      renderingData.sessions.forEach((session) => {
        if (session.nodeIds.length > 0) {
          dot += `    }\n`;
        }
      });
      
      dot += `  }\n`;
    });
    
    // Add edges from clean rendering data
    this._conversations.forEach(conversation => {
      const renderingData = conversation._renderingData;
      if (renderingData && renderingData.edges) {
        renderingData.edges.forEach(edge => {
          dot += `  "${edge.from}" -> "${edge.to}";\n`;
        });
      }
    });
    
    dot += '}';
    
    // Render using Graphviz
    await this.renderDotGraph(dot);
  }
  
  getMessagesToRender(conversation) {
    // Use clean rendering data instead of deprecated abstractMessages
    if (conversation._renderingData && conversation._renderingData.nodes) {
      // Convert rendering nodes back to message-like objects for compatibility
      return conversation._renderingData.nodes.map(node => {
        if (node.type === 'message' && node.originalMessage) {
          return node.originalMessage;
        } else if (node.type === 'tool_interaction') {
          // Create a tool group object for compatibility
          return {
            uuid: node.id,
            type: 'tool_interaction',
            toolCallMessage: node.originalMessages[0],
            toolResultMessage: node.originalMessages[1],
            role: 'tool_interaction',
            sessionId: node.sessionId
          };
        } else if (node.type === 'agent_activity') {
          // Create an agent group object for compatibility
          return {
            uuid: node.id,
            type: 'agent_activity',
            messages: node.originalMessages,
            role: 'agent_activity',
            sessionId: node.sessionId,
            toolCallCount: node.toolCallCount,
            toolResultCount: node.toolResultCount,
            assistantMessageCount: node.assistantMessageCount,
            totalMessages: node.totalMessages
          };
        }
        return node; // Fallback
      });
    }
    
    // Fallback to detailed view if no rendering data
    const allMessages = [];
    this._messages.forEach((message, uuid) => {
      if (message.conversationId === conversation.conversationId) {
        allMessages.push(message);
      }
    });
    return allMessages;
  }
  
  getMessageLabel(messageData) {
    // Use "X" as placeholder for consistent circle sizing - we'll replace it at runtime
    return "X";
  }
  
  getRuntimeLabel(messageData) {
    // This will be used to patch labels into the SVG after Graphviz rendering (detailed view only)
    if (messageData.role === 'user' || messageData.isUserMessage) {
      return '👤'; // User icon  
    } else if (messageData.role === 'assistant') {
      return '🤖'; // Assistant icon
    } else if (messageData.role === 'system') {
      return '⚙️'; // System icon
    } else if (messageData.role === 'tool_use') {
      return '🔧'; // Tool use icon
    } else if (messageData.role === 'tool_result') {
      return '📋'; // Tool result icon
    } else {
      return messageData.uuid ? messageData.uuid.substring(0, 4) : '❓'; // Fallback
    }
  }
  
  getMessageColor(message) {
    // Use shared color library for consistent colors across all Claude components
    return ClaudeMessageColors.getGraphvizColor(message);
  }
  
  getMessageTitle(message) {
    if (message.type === 'tool_interaction') {
      // For tool interaction groups, show combined information
      const toolName = this.extractToolName(message.toolCallMessage);
      return `Tool Interaction: ${toolName}\\nCall + Result grouped\\nSession: ${message.sessionId.substring(0, 8)}`;
    } else if (message.type === 'agent_activity') {
      // For agent activity groups, show activity summary
      const sessionId = message.sessionId ? message.sessionId.substring(0, 8) : 'unknown';
      const activities = [];
      if (message.assistantMessageCount > 0) activities.push(`${message.assistantMessageCount} responses`);
      if (message.toolCallCount > 0) activities.push(`${message.toolCallCount} tool calls`);
      if (message.toolResultCount > 0) activities.push(`${message.toolResultCount} tool results`);
      const activitySummary = activities.join(', ') || 'no activities';
      
      return `Agent Activity Group\\n${message.totalMessages} messages: ${activitySummary}\\nSession: ${sessionId}`;
    } else {
      const role = message.role || 'unknown';
      const sessionId = message.sessionId ? message.sessionId.substring(0, 8) : 'unknown';
      const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : 'no timestamp';
      
      return `Role: ${role}\\nSession: ${sessionId}\\nTime: ${timestamp}`;
    }
  }
  
  extractToolName(toolCallMessage) {
    // Extract tool name from tool call message
    if (toolCallMessage.message?.content && Array.isArray(toolCallMessage.message.content)) {
      const toolCall = toolCallMessage.message.content.find(c => c.type === 'tool_use');
      if (toolCall && toolCall.name) {
        return toolCall.name;
      }
    }
    return 'Unknown Tool';
  }
  
  findVisibleParent(parentUuid, messagesToRender, conversation) {
    // Walk up the parent chain until we find a message that's visible in the current abstraction
    const visited = new Set(); // Prevent infinite loops
    let currentParentUuid = parentUuid;
    
    while (currentParentUuid && !visited.has(currentParentUuid)) {
      visited.add(currentParentUuid);
      
      // Check if this parent is visible in the current rendering
      const isVisible = messagesToRender.some(m => m.uuid === currentParentUuid);
      if (isVisible) {
        return currentParentUuid;
      }
      
      // Check if this parent is a tool group
      if (conversation.toolGroups) {
        for (const [groupId, toolGroup] of conversation.toolGroups) {
          if (toolGroup.toolCallMessage.uuid === currentParentUuid || 
              toolGroup.toolResultMessage.uuid === currentParentUuid) {
            // Parent is part of a tool group, check if the group is visible
            const groupVisible = messagesToRender.some(m => m.uuid === groupId);
            if (groupVisible) {
              return groupId;
            }
            break;
          }
        }
      }
      
      // Check if this parent is an agent group
      if (conversation.agentGroups) {
        for (const [groupId, agentGroup] of conversation.agentGroups) {
          if (agentGroup.messages && agentGroup.messages.some(msg => msg.uuid === currentParentUuid)) {
            // Parent is part of an agent group, check if the group is visible
            const groupVisible = messagesToRender.some(m => m.uuid === groupId);
            if (groupVisible) {
              return groupId;
            }
            break;
          }
        }
      }
      
      // Parent is not visible, walk up to its parent
      const parentMessage = this._messages.get(currentParentUuid);
      if (parentMessage && parentMessage.parentUuid) {
        currentParentUuid = parentMessage.parentUuid;
      } else {
        break; // No more parents to check
      }
    }
    
    return null; // No visible parent found
  }
  
  findNextVisibleParentInSimpleMode(parentUuid, hiddenMessages, conversation) {
    // Walk up the parent chain until we find a message that's not hidden
    const visited = new Set(); // Prevent infinite loops
    let currentParentUuid = parentUuid;
    
    while (currentParentUuid && !visited.has(currentParentUuid)) {
      visited.add(currentParentUuid);
      
      // Check if this parent is not hidden
      if (!hiddenMessages.has(currentParentUuid)) {
        return currentParentUuid;
      }
      
      // Parent is hidden, walk up to its parent
      const parentMessage = this._messages.get(currentParentUuid);
      if (parentMessage && parentMessage.parentUuid) {
        currentParentUuid = parentMessage.parentUuid;
      } else {
        break; // No more parents to check
      }
    }
    
    return null; // No visible parent found
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
      
      // Patch in unicode labels after Graphviz rendering
      this.patchRuntimeLabels();
      
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
              
              // Check if this is a regular message (detailed view only)
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
  
  patchRuntimeLabels() {
    try {
      if (!this.graphviz || !this.graphviz.shadowRoot) return;
      
      // Find all node groups in the SVG
      const nodeGroups = this.graphviz.shadowRoot.querySelectorAll("g.node");
      
      nodeGroups.forEach(nodeGroup => {
        const titleElement = nodeGroup.querySelector('title');
        if (!titleElement) return;
        
        const uuid = titleElement.textContent.trim();
        let messageData = null;
        
        // Find the message data for this UUID (detailed view only)
        if (this._messages.has(uuid)) {
          messageData = this._messages.get(uuid);
        }
        
        if (messageData) {
          // Get the runtime label (unicode icon)
          const label = this.getRuntimeLabel(messageData);
          
          // Find the existing text element with "X" and replace it
          const textElement = nodeGroup.querySelector('text');
          if (textElement && textElement.textContent === 'X') {
            textElement.textContent = label;
            // Ensure proper styling for unicode icons
            textElement.setAttribute('font-size', '12');
            textElement.setAttribute('font-family', 'Arial, sans-serif');
            textElement.setAttribute('fill', '#333');
          }
          
          // Add descriptive label for tool-related messages
          this.addToolDescriptiveLabel(nodeGroup, messageData);
        }
      });
      
    } catch (error) {
      console.warn('Failed to patch runtime labels:', error);
    }
  }
  
  addToolDescriptiveLabel(nodeGroup, messageData) {
    // Only add descriptive labels for tool-related messages and user messages
    if (!this.isToolRelated(messageData) && !this.isUserMessage(messageData)) {
      return;
    }
    
    // Get the label text based on message type
    let labelText = null;
    if (this.isToolRelated(messageData)) {
      labelText = this.getToolInfo(messageData);
    } else if (this.isUserMessage(messageData)) {
      labelText = this.getUserMessagePreview(messageData);
    }
    
    if (!labelText) {
      return;
    }
    
    // Find the ellipse to position label relative to it
    const ellipse = nodeGroup.querySelector('ellipse');
    if (!ellipse) {
      return;
    }
    
    const cx = parseFloat(ellipse.getAttribute('cx') || 0);
    const cy = parseFloat(ellipse.getAttribute('cy') || 0);
    const rx = parseFloat(ellipse.getAttribute('rx') || 10); // Circle radius
    
    // Position label to the right of the circle with some padding
    const labelX = cx + rx + 8; // 8px padding from circle edge
    const labelY = cy;
    
    if (this.isUserMessage(messageData)) {
      // For user messages, create multi-line text with word wrapping
      this.createWrappedTextElement(nodeGroup, labelText, labelX, labelY);
    } else {
      // For tool-related messages, single line as before
      const labelElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelElement.setAttribute('x', labelX);
      labelElement.setAttribute('y', labelY);
      labelElement.setAttribute('text-anchor', 'start'); // Left-aligned
      labelElement.setAttribute('dominant-baseline', 'central');
      labelElement.setAttribute('font-size', '10');
      labelElement.setAttribute('font-family', 'Arial, sans-serif');
      labelElement.setAttribute('fill', '#666'); // Slightly muted color
      labelElement.setAttribute('pointer-events', 'none'); // Don't interfere with clicks
      labelElement.textContent = labelText;
      
      // Add the label to the node group
      nodeGroup.appendChild(labelElement);
    }
  }
  
  getUserMessagePreview(messageData) {
    // Extract first 100 characters from user message content
    const content = messageData.message?.content;
    let preview = '';
    
    if (content) {
      if (Array.isArray(content) && content.length > 0 && content[0].text) {
        preview = content[0].text;
      } else if (typeof content === 'string') {
        preview = content;
      }
    }
    
    if (preview.length > 100) {
      preview = preview.substring(0, 100).trim() + '...';
    }
    
    return preview || 'User message';
  }
  
  createWrappedTextElement(nodeGroup, text, startX, startY) {
    // Create wrapped text for user messages with line breaking at ~150px width
    const maxWidth = 150;
    const fontSize = 9; // Smaller font for user text
    const lineHeight = 12; // Line spacing
    
    // Split text into words
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';
    
    // Simple word wrapping - estimate character width (not perfect but functional)
    const avgCharWidth = fontSize * 0.6; // Rough estimate for Arial
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word longer than line - break it
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Limit to 3 lines maximum to avoid too much vertical space
    if (lines.length > 3) {
      lines.splice(3);
      if (lines[2]) {
        lines[2] = lines[2] + '...';
      }
    }
    
    // Create text elements for each line
    lines.forEach((line, index) => {
      const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElement.setAttribute('x', startX);
      textElement.setAttribute('y', startY + (index * lineHeight) - ((lines.length - 1) * lineHeight / 2)); // Center vertically
      textElement.setAttribute('text-anchor', 'start');
      textElement.setAttribute('dominant-baseline', 'central');
      textElement.setAttribute('font-size', fontSize);
      textElement.setAttribute('font-family', 'Arial, sans-serif');
      textElement.setAttribute('fill', '#888'); // Slightly lighter than tool labels
      textElement.setAttribute('pointer-events', 'none');
      textElement.textContent = line;
      
      nodeGroup.appendChild(textElement);
    });
  }
  
  isToolRelated(messageData) {
    return messageData.type === 'tool_interaction' || 
           messageData.type === 'agent_activity' ||
           messageData.role === 'tool_use' || 
           messageData.role === 'tool_result' ||
           this.isToolCallMessage(messageData) ||
           this.isToolResultMessage(messageData);
  }
  
  getToolInfo(messageData) {
    if (messageData.type === 'tool_interaction') {
      // For tool interaction groups, show the tool name
      const toolName = this.extractToolName(messageData.toolCallMessage);
      return toolName;
    } else if (messageData.type === 'agent_activity') {
      // For agent activity groups, show activity summary
      const activities = [];
      if (messageData.assistantMessageCount > 0) activities.push(`${messageData.assistantMessageCount} msg`);
      if (messageData.toolCallCount > 0) activities.push(`${messageData.toolCallCount} calls`);
      if (messageData.toolResultCount > 0) activities.push(`${messageData.toolResultCount} results`);
      return activities.join(', ') || 'agent activity';
    } else if (messageData.role === 'tool_use' || this.isToolCallMessage(messageData)) {
      // For individual tool calls
      const toolName = this.extractToolName(messageData);
      return `${toolName} (call)`;
    } else if (messageData.role === 'tool_result' || this.isToolResultMessage(messageData)) {
      // For tool results, try to get the tool name from the result
      const toolName = this.extractToolNameFromResult(messageData);
      return `${toolName} (result)`;
    }
    
    return null;
  }
  
  extractToolNameFromResult(resultMessage) {
    // Try to extract tool name from tool result message
    if (resultMessage.message?.content && Array.isArray(resultMessage.message.content)) {
      const toolResult = resultMessage.message.content.find(c => c.type === 'tool_result');
      if (toolResult && toolResult.tool_use_id) {
        // We could try to match this with a previous tool call, but for now just return generic
        return 'Tool';
      }
    }
    
    // Check if there's a toolUseResult with tool information
    if (resultMessage.toolUseResult) {
      // Look for common tool patterns in the result
      const result = resultMessage.toolUseResult;
      if (result.newTodos || result.oldTodos) {
        return 'TodoWrite';
      }
      // Add more specific tool detection as needed
    }
    
    return 'Tool';
  }
  
  getSessionColor(sessionIndex) {
    // Generate different colors for different sessions to show nesting using shared color library
    const roles = ClaudeMessageColors.getRoles();
    const role = roles[sessionIndex % roles.length];
    // Use lightened version of the base color for session backgrounds
    return ClaudeMessageColors.lighten(ClaudeMessageColors.getGraphvizColor(role), 0.8);
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
    if (clusterElement) {
      try {
        // Get absolute position of the clicked cluster
        const clusterPos = lively.getClientPosition(clusterElement);
        
        // Calculate target position with offset
        const offset = lively.pt(100, 25); // Right 100px, down 25px from the cluster
        const detailsPos = clusterPos.addPt(offset);
        
        // Use lively.setClientPosition to handle scrolling properly
        lively.setClientPosition(this.details, detailsPos);
      } catch (error) {
        console.warn('Failed to position details panel:', error);
        // Fallback positioning using lively.setClientPosition
        lively.setClientPosition(this.details, lively.pt(20, 20));
      }
    } else {
      // Fallback positioning if no cluster reference
      lively.setClientPosition(this.details, lively.pt(20, 20));
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
      this.details.style.display = 'none';
    });
    
    const closeBtn = <button style="padding: 8px 12px; background: #ddd; color: black; border: none; border-radius: 3px; cursor: pointer;">Close</button>;
    closeBtn.addEventListener('click', () => {
      this.details.style.display = 'none';
      this._currentlyOpenMessage = null;
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
      this.details.style.display = 'none';
    });
    
    const closeBtn = <button style="padding: 8px 12px; background: #ddd; color: black; border: none; border-radius: 3px; cursor: pointer;">Close</button>;
    closeBtn.addEventListener('click', () => {
      this.details.style.display = 'none';
      this._currentlyOpenMessage = null;
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
    // Toggle functionality - if clicking on the same message, close the details
    if (this._currentlyOpenMessage === uuid && this.details.style.display === 'block') {
      this.details.style.display = 'none';
      this._currentlyOpenMessage = null;
      return;
    }
    
    // Track the currently open message
    this._currentlyOpenMessage = uuid;
    
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
      this.details.style.display = 'none';
    });
    
    const inspectorBtn = <button style="padding: 8px 12px; background: #ffc107; color: black; border: none; border-radius: 3px; cursor: pointer;">Open Inspector</button>;
    inspectorBtn.addEventListener('click', async () => {
      lively.openInspector(message, null, "Message Data");
      this.details.style.display = 'none';
    });
    
    const closeBtn = <button style="padding: 8px 12px; background: #ddd; color: black; border: none; border-radius: 3px; cursor: pointer;">Close</button>;
    closeBtn.addEventListener('click', () => {
      this.details.style.display = 'none';
      this._currentlyOpenMessage = null;
    });
    
    const messageDetails = <div>
      <h3>Message Details</h3>
      <div><strong>UUID:</strong> {uuid.substring(0, 8)}...</div>
      <div><strong>Role:</strong> {role}</div>
      <div><strong>Session:</strong> {sessionId}</div>
      <div><strong>Sessions:</strong> {message.sessions}</div>
      <div><strong>Conversation:</strong> {conversationTitle}</div>
      <div><strong>Has Parent:</strong> {hasParent}</div>
      <div><strong>Timestamp:</strong> {timestamp}</div>
      <div style="margin-top: 10px;"><strong>Content Preview:</strong></div>
      <div style="background: #f9f9f9; padding: 8px; border-radius: 3px; font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 150px; overflow-y: auto;">{preview || 'No content available'}</div>
      <div style="margin-top: 15px;"><strong>Actions:</strong></div>
      <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
        {goToMessageBtn}
        {inspectorBtn}
        {closeBtn}
      </div>
    </div>;
    
    this.details.innerHTML = '';
    this.details.appendChild(messageDetails);
    
    // Position the details panel under the clicked message (following literature-graph pattern)
    if (svgNode) {
      try {
        // Get absolute position of the clicked node
        const nodePos = lively.getClientPosition(svgNode);
        
        // Calculate target position with offset
        const offset = lively.pt(100, 25); // Right 100px, down 25px from the node
        const detailsPos = nodePos.addPt(offset);
        
        // Use lively.setClientPosition to handle scrolling properly
        lively.setClientPosition(this.details, detailsPos);
      } catch (error) {
        console.warn('Failed to position details panel:', error);
        // Fallback positioning using lively.setClientPosition
        lively.setClientPosition(this.details, lively.pt(20, 20));
      }
    } else {
      // Fallback positioning if no node reference
      lively.setClientPosition(this.details, lively.pt(20, 20));
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
    this._currentlyOpenMessage = other._currentlyOpenMessage || null;
    
    // Preserve zoom level from previous instance
    if (other.zooming) {
      this._zoomLevel = other.zooming.getZoom();
    }
  }
}