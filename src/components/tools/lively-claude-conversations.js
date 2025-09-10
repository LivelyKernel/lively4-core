import Morph from 'src/components/widgets/lively-morph.js';
import ClaudeSessions from 'src/client/claude-sessions.js';
import ClaudeMessageColors from 'src/client/claude-message-colors.js';
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
    this.abstractionSelect = this.get("#abstractionSelect");
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
    this._abstractionLevel = this._abstractionLevel || this.getAttribute('abstraction-level') || 'detailed';
    this._currentlyOpenMessage = this._currentlyOpenMessage || null; // Track currently open message for toggle
    
    this.registerButtons();
    
    // Setup project selector
    this.projectSelect.addEventListener('change', () => {
      this.setAttribute('selected-project', this.projectSelect.value);
      this._currentProject = this.projectSelect.value;
    });
    
    // Setup abstraction level selector
    this.abstractionSelect.addEventListener('change', () => {
      this.setAttribute('abstraction-level', this.abstractionSelect.value);
      this._abstractionLevel = this.abstractionSelect.value;
      this.onAbstractionLevelChanged();
    });
    
    // Set initial abstraction level selection
    if (this.abstractionSelect) {
      this.abstractionSelect.value = this._abstractionLevel;
    }
    
    // Load projects
    if (this._conversations.length == 0) {
      this.loadProjects();
    } else {
      this.populateProjectDropdown();
      this.renderGraph()
    }
  }
  
  onAbstractionLevelChanged() {
    // Close any open details panel when changing abstraction level
    this.details.style.display = 'none';
    this._currentlyOpenMessage = null;
    
    // Re-render the graph with new abstraction level
    if (this._conversations.length > 0 && this._messages.size > 0) {
      this.renderGraph();
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
      
      // Process tool groupings based on abstraction level
      this.processToolGroupings(conversation);
    });
  }
  
  processToolGroupings(conversation) {
    // Create tool interaction groups for abstract visualization
    conversation.toolGroups = new Map(); // groupId -> {toolCallMessage, toolResultMessage, groupId}
    conversation.abstractMessages = new Map(); // For abstract view: uuid -> message or group
    
    // Copy all messages initially
    this._messages.forEach((message, uuid) => {
      if (message.conversationId === conversation.conversationId) {
        conversation.abstractMessages.set(uuid, message);
      }
    });
    
    if (this._abstractionLevel === 'abstract') {
      // Find tool call-result pairs and group them
      const processedResults = new Set();
      
      this._messages.forEach((message, uuid) => {
        if (message.conversationId !== conversation.conversationId) return;
        
        // Check if this is a tool call (assistant message with tool_use)
        if (this.isToolCallMessage(message) && !processedResults.has(uuid)) {
          // Look for corresponding tool result
          const resultMessage = this.findToolResultForCall(message, conversation);
          
          if (resultMessage && !processedResults.has(resultMessage.uuid)) {
            // Create tool interaction group
            const groupId = `tool_group_${uuid}`;
            
            // Determine the correct parent for the tool group
            // The group should inherit the parent of the tool call message
            let groupParent = message.parentUuid;
            
            // If the tool call's parent is also being grouped/hidden, we'll let
            // findVisibleParent handle walking up the chain during edge rendering
            
            const toolGroup = {
              groupId,
              toolCallMessage: message,
              toolResultMessage: resultMessage,
              type: 'tool_interaction',
              uuid: groupId, // Virtual UUID for this group
              parentUuid: groupParent, // Inherit parent relationship from tool call
              conversationId: message.conversationId,
              sessionId: message.sessionId,
              sessionPath: message.sessionPath,
              role: 'tool_interaction', // Special role for groups
              timestamp: message.timestamp // Use tool call timestamp for ordering
            };
            
            conversation.toolGroups.set(groupId, toolGroup);
            
            // Replace individual messages with group in abstract view
            conversation.abstractMessages.set(groupId, toolGroup);
            conversation.abstractMessages.delete(uuid);
            conversation.abstractMessages.delete(resultMessage.uuid);
            
            processedResults.add(uuid);
            processedResults.add(resultMessage.uuid);
          }
        }
      });
      
      // Update parent relationships for messages that reference grouped messages
      conversation.abstractMessages.forEach((message, uuid) => {
        if (message.type !== 'tool_interaction' && message.parentUuid) {
          // Check if this message's parent was grouped into a tool interaction
          for (const [groupId, toolGroup] of conversation.toolGroups) {
            if (toolGroup.toolCallMessage.uuid === message.parentUuid || 
                toolGroup.toolResultMessage.uuid === message.parentUuid) {
              // Update the parent to point to the tool group instead
              message.parentUuid = groupId;
              break;
            }
          }
        }
      });
    } else if (this._abstractionLevel === 'simple') {
      // Remove tool-related messages entirely
      const hiddenMessages = new Set();
      
      this._messages.forEach((message, uuid) => {
        if (message.conversationId !== conversation.conversationId) return;
        
        if (this.isToolCallMessage(message) || this.isToolResultMessage(message)) {
          conversation.abstractMessages.delete(uuid);
          hiddenMessages.add(uuid);
        }
      });
      
      // Update parent relationships for messages that reference hidden messages
      conversation.abstractMessages.forEach((message, uuid) => {
        if (message.parentUuid && hiddenMessages.has(message.parentUuid)) {
          // Find the next visible parent by walking up the chain
          const visibleParent = this.findNextVisibleParentInSimpleMode(message.parentUuid, hiddenMessages, conversation);
          message.parentUuid = visibleParent; // May be null if no visible parent found
        }
      });
    }
    // For 'detailed', abstractMessages remains the same as all messages
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
      
      // Add messages based on abstraction level
      const messagesToRender = this.getMessagesToRender(conversation);
      
      messagesToRender.forEach(messageData => {
        const messageUuid = messageData.uuid;
        const color = this.getMessageColor(messageData);
        const title = this.getMessageTitle(messageData);
        const label = this.getMessageLabel(messageData);
        
        dot += `      "${messageUuid}" [label="${label}", fillcolor="${color}", style="filled", tooltip="${title}", title="${messageUuid}"];\n`;
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
    // Use abstract messages for edge rendering based on abstraction level
    this._conversations.forEach(conversation => {
      const messagesToRender = this.getMessagesToRender(conversation);
      messagesToRender.forEach(messageData => {
        if (messageData.parentUuid) {
          // Find the actual visible parent (may need to walk up the chain)
          const visibleParent = this.findVisibleParent(messageData.parentUuid, messagesToRender, conversation);
          if (visibleParent && visibleParent !== messageData.uuid) {
            dot += `  "${visibleParent}" -> "${messageData.uuid}";\n`;
          }
        }
      });
    });
    
    dot += '}';
    
    // Render using Graphviz
    await this.renderDotGraph(dot);
  }
  
  getMessagesToRender(conversation) {
    // Return messages based on abstraction level
    if (this._abstractionLevel === 'abstract' && conversation.abstractMessages) {
      return Array.from(conversation.abstractMessages.values());
    } else if (this._abstractionLevel === 'simple' && conversation.abstractMessages) {
      return Array.from(conversation.abstractMessages.values());
    } else {
      // Detailed view - return all messages for this conversation
      const allMessages = [];
      this._messages.forEach((message, uuid) => {
        if (message.conversationId === conversation.conversationId) {
          allMessages.push(message);
        }
      });
      return allMessages;
    }
  }
  
  getMessageLabel(messageData) {
    // Use "X" as placeholder for consistent circle sizing - we'll replace it at runtime
    return "X";
  }
  
  getRuntimeLabel(messageData) {
    // This will be used to patch labels into the SVG after Graphviz rendering
    if (messageData.type === 'tool_interaction') {
      return '🔧'; // Tool icon
    } else if (messageData.role === 'user' || messageData.isUserMessage) {
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
      return messageData.uuid.substring(0, 4); // Fallback to UUID prefix
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
              
              // Check if this is a regular message
              if (uuid && this._messages.has(uuid)) {
                this.onMessageClick(evt, uuid, this._messages.get(uuid), svgNode);
              } else if (uuid.startsWith('tool_group_')) {
                // Check if this is a tool interaction group
                const conversation = this._conversations.find(conv => 
                  conv.toolGroups && conv.toolGroups.has(uuid)
                );
                if (conversation && conversation.toolGroups.has(uuid)) {
                  this.onToolGroupClick(evt, uuid, conversation.toolGroups.get(uuid), svgNode);
                }
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
        
        // Find the message data for this UUID
        if (this._messages.has(uuid)) {
          messageData = this._messages.get(uuid);
        } else if (uuid.startsWith('tool_group_')) {
          // Check tool groups
          for (const conversation of this._conversations) {
            if (conversation.toolGroups && conversation.toolGroups.has(uuid)) {
              messageData = conversation.toolGroups.get(uuid);
              break;
            }
          }
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
    // Only add descriptive labels for tool-related messages
    if (!this.isToolRelated(messageData)) {
      return;
    }
    
    // Get the tool name and description
    const toolInfo = this.getToolInfo(messageData);
    if (!toolInfo) {
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
    
    // Create descriptive label text element
    const labelElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelElement.setAttribute('x', labelX);
    labelElement.setAttribute('y', labelY);
    labelElement.setAttribute('text-anchor', 'start'); // Left-aligned
    labelElement.setAttribute('dominant-baseline', 'central');
    labelElement.setAttribute('font-size', '10');
    labelElement.setAttribute('font-family', 'Arial, sans-serif');
    labelElement.setAttribute('fill', '#666'); // Slightly muted color
    labelElement.setAttribute('pointer-events', 'none'); // Don't interfere with clicks
    labelElement.textContent = toolInfo;
    
    // Add the label to the node group
    nodeGroup.appendChild(labelElement);
  }
  
  isToolRelated(messageData) {
    return messageData.type === 'tool_interaction' || 
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
  
  onToolGroupClick(evt, groupId, toolGroup, svgNode) {
    // Toggle functionality - if clicking on the same tool group, close the details
    if (this._currentlyOpenMessage === groupId && this.details.style.display === 'block') {
      this.details.style.display = 'none';
      this._currentlyOpenMessage = null;
      return;
    }
    
    // Track the currently open message
    this._currentlyOpenMessage = groupId;
    
    // Show tool interaction group details
    const toolName = this.extractToolName(toolGroup.toolCallMessage);
    const sessionId = toolGroup.sessionId ? toolGroup.sessionId.substring(0, 8) : 'unknown';
    
    // Create tool group details content using JSX
    const expandGroupBtn = <button style="padding: 8px 12px; background: #17a2b8; color: white; border: none; border-radius: 3px; cursor: pointer;">Expand to Detailed View</button>;
    expandGroupBtn.addEventListener('click', async () => {
      // Switch to detailed view to show individual tool call and result
      this._abstractionLevel = 'detailed';
      this.abstractionSelect.value = 'detailed';
      this.setAttribute('abstraction-level', 'detailed');
      await this.renderGraph();
      this.details.style.display = 'none';
    });
    
    const inspectorBtn = <button style="padding: 8px 12px; background: #ffc107; color: black; border: none; border-radius: 3px; cursor: pointer;">Open Inspector</button>;
    inspectorBtn.addEventListener('click', async () => {
      lively.openInspector(toolGroup, null, "Tool Group Data");
      this.details.style.display = 'none';
    });
    
    const closeBtn = <button style="padding: 8px 12px; background: #ddd; color: black; border: none; border-radius: 3px; cursor: pointer;">Close</button>;
    closeBtn.addEventListener('click', () => {
      this.details.style.display = 'none';
      this._currentlyOpenMessage = null;
    });
    
    const toolGroupDetails = <div>
      <h3>Tool Interaction</h3>
      <div><strong>Tool Name:</strong> {toolName}</div>
      <div><strong>Group ID:</strong> {groupId}</div>
      <div><strong>Session:</strong> {sessionId}</div>
      <div><strong>Call Message:</strong> {toolGroup.toolCallMessage.uuid.substring(0, 8)}...</div>
      <div><strong>Result Message:</strong> {toolGroup.toolResultMessage.uuid.substring(0, 8)}...</div>
      <div><strong>Type:</strong> Grouped tool call and result</div>
      <div style="margin-top: 15px;"><strong>Actions:</strong></div>
      <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
        {expandGroupBtn}
        {inspectorBtn}
        {closeBtn}
      </div>
    </div>;
    
    this.details.innerHTML = '';
    this.details.appendChild(toolGroupDetails);
    
    // Position the details panel under the clicked group
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
    this._abstractionLevel = other._abstractionLevel || 'detailed';
    this._currentlyOpenMessage = other._currentlyOpenMessage || null;
    
    // Preserve zoom level from previous instance
    if (other.zooming) {
      this._zoomLevel = other.zooming.getZoom();
    }
  }
}