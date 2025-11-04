import LivelyChat from 'src/components/tools/lively-chat.js';
import Dexie from "src/external/dexie3.js";
import { uuid as generateUuid } from 'utils';
import ContextMenu from 'src/client/contextmenu.js';
import * as cop  from "src/client/ContextJS/src/contextjs.js";

import OpenaiRealtimeChat from "src/components/tools/openai-realtime-chat.js"



/*MD
# [Lively AI Workspace](browse://doc/tools/ai-workspace.md)

MD*/

export default class LivelyAiWorkspace extends LivelyChat {

  /*MD ## Database Schema MD*/
  static get historydb() {
    var db = new Dexie("lively-ai-workspace-history");
    db.version(6).stores({
      workspaces: 'id, timestamp, lastActivityTime, title, conversationId, opencodeSessionId',
    }).upgrade(function () {
      console.log('[AI Workspace] Database upgraded');
    });

    return db;
  }
  
  /*MD ## Initialize MD*/
  // #override 
  updateMessagesDebugState() {
    if (this.sharedMessagesPane) {
      Array.from(this.sharedMessagesPane.querySelectorAll("lively-chat-message")).forEach(ea => {
        ea.showDebug = this.showDebug;
      });
    }
  }
    
  // #important
  async initialize() {
    this.windowTitle = "AI Workspace";
    this.registerButtons();

    this.blackboard = this.blackboard || {
      currentTask: null,
      agentStatus: 'idle',
      coordination: {},
      lastUpdate: Date.now(),
      pendingRequests: new Map(),    // Map<requestId, {task, timestamp, status, audioWaiting}>
      completedRequests: new Map()   // Map<requestId, {task, response, timestamp}>
    };

    this.addEventListener('contextmenu', evt => this.createBaseContextMenu(evt), false);
    
    this.opencodeComponent = null;
    this.realtimeComponent = null;

    this.sharedMessagesPane = this.get('#sharedMessagesPane');

    this.currentLiveSharedMessageElement = null;
    this.currentLiveSharedMessageRole = null;

    await this.initializeWorkspaceHistory();

    await this.initializeComponents();

    await this.renderSessionsList();
    await this.renderSharedMessages();
  }

  /*MD ## Workspace History Management MD*/

  async initializeWorkspaceHistory() {
    if (!this.workspaceId) {
      // Try to restore most recent workspace
      try {
        const workspaces = await LivelyAiWorkspace.historydb.workspaces
          .orderBy('lastActivityTime')
          .reverse()
          .limit(1)
          .toArray();

        if (workspaces.length > 0) {
          this.workspaceId = workspaces[0].id;
          console.log('[AI Workspace] Restored workspace:', this.workspaceId);
        } else {
          // Create new workspace
          await this.createNewWorkspace();
        }
      } catch (error) {
        console.error('Failed to restore workspace:', error);
        await this.createNewWorkspace();
      }
    }
  }

  async createNewWorkspace() {
    this.workspaceId = generateUuid();
    const now = new Date();
    try {
      await LivelyAiWorkspace.historydb.workspaces.add({
        id: this.workspaceId,
        timestamp: now.toISOString(),
        lastActivityTime: now.toISOString(),
        title: null,  // Title is generated from lastActivityTime
        conversationId: null,
        opencodeSessionId: null
      });
      console.log('[AI Workspace] Created new workspace:', this.workspaceId);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  }

  /*MD ## Unified Session Management MD*/

  async createWorkspaceSession(title) {
    try {
      const now = new Date();
      const workspaceId = generateUuid();

      // Create conversation in realtime chat DB if component exists
      let conversationId = null;
      if (this.realtimeComponent) {
        conversationId = generateUuid();
        const OpenaiRealtimeChat = (await System.import('src/components/tools/openai-realtime-chat.js')).default;
        await OpenaiRealtimeChat.conversationdb.conversations.add({
          id: conversationId,
          timestamp: now.toISOString(),
          lastMessageTime: now.toISOString()
        });
        console.log('[AI Workspace] Created conversation:', conversationId);
      }

      // Create OpenCode session if component exists
      let opencodeSessionId = null;
      if (this.opencodeComponent && this.opencodeComponent.connected) {
        const result = await this.createOpenCodeSession(title);
        if (result.success) {
          opencodeSessionId = result.session.id;
          console.log('[AI Workspace] Created OpenCode session:', opencodeSessionId);
        }
      }

      // Create workspace entry linking both
      await LivelyAiWorkspace.historydb.workspaces.add({
        id: workspaceId,
        timestamp: now.toISOString(),
        lastActivityTime: now.toISOString(),
        conversationId: conversationId,
        opencodeSessionId: opencodeSessionId
      });
      console.log('[AI Workspace] Created workspace session:', workspaceId);
      return {
        success: true,
        workspaceId: workspaceId,
        conversationId: conversationId,
        opencodeSessionId: opencodeSessionId
      };

    } catch (error) {
      console.error('[AI Workspace] Failed to create workspace session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async switchWorkspaceSession(workspaceId) {
    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(workspaceId);

      if (!workspace) {
        return {
          success: false,
          error: 'Workspace not found'
        };
      }
      
      // Switch conversation in realtime chat
      if (this.realtimeComponent) {
        if (workspace.conversationId) {
          await this.realtimeComponent.setConversation(workspace.conversationId);
        } else {
          this.realtimeComponent.responses.innerHTML = '<div class="empty-chat">This is an old session without audio chat data. Create a new session to continue.</div>';
        }
      }

      // Switch OpenCode session
      if (this.opencodeComponent) {
        if (workspace.opencodeSessionId) {
          // Reload sessions first to ensure we have the latest data
          await this.opencodeComponent.loadSessions();
          const session = this.opencodeComponent.sessions.find(s => s.id === workspace.opencodeSessionId);
          if (session) {
            await this.opencodeComponent.selectSession(session);
            console.log('[AI Workspace] Switched to OpenCode session:', workspace.opencodeSessionId);
          }
        } else {
          // Old workspace without opencodeSessionId - clear the display
          const container = this.opencodeComponent.get('#messagesContainer');
          if (container) {
            container.innerHTML = '<div class="empty-chat">This is an old session without code chat data. Create a new session to continue.</div>';
          }
          console.warn('[AI Workspace] Workspace has no opencodeSessionId - old session format');
        }
      }

      // Update current workspace ID
      this.workspaceId = workspaceId;

      // Re-render shared messages for the new workspace
      await this.renderSharedMessages();

      // Update UI - refresh sessions list to show new active session
      await this.updateSessionUI();

      return {
        success: true,
        workspace: workspace
      };

    } catch (error) {
      console.error('[AI Workspace] Failed to switch workspace session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }


  async listWorkspaceSessions() {
    try {
      return await LivelyAiWorkspace.historydb.workspaces
        .orderBy('timestamp')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('[AI Workspace] Failed to list workspace sessions:', error);
      return [];
    }
  }


  async deleteWorkspaceSession(workspaceId) {
    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(workspaceId);
      if (!workspace) {
        return {
          success: false,
          error: 'Workspace not found'
        };
      }
      await LivelyAiWorkspace.historydb.workspaces.delete(workspaceId);
      // If this was the current workspace, switch to most recent
      if (this.workspaceId === workspaceId) {
        await this.initializeWorkspaceHistory();
      }

      console.log('[AI Workspace] Deleted workspace session:', workspaceId);
      return {
        success: true
      };

    } catch (error) {
      console.error('[AI Workspace] Failed to delete workspace session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /*MD ## Message Display Hooks MD*/

  setupOpenCodeMessageCapture() {
    if (!this.opencodeComponent) return;
    // Just trigger re-render when OpenCode updates
    const originalDisplayMessages = this.opencodeComponent.displayMessages.bind(this.opencodeComponent);
    // #TODO this is a very generic event... and a very generic reaction!
    this.opencodeComponent.displayMessages = async () => {
      await originalDisplayMessages();
      await this.renderSharedMessages(); 
    };
  }

  setupRealtimeMessageCapture() {
    if (!this.realtimeComponent) return;
    var that = this;
    cop.layer(this, "LivelyAIWorkspaceLayer").refineObject(this.realtimeComponent, {
      async createLiveUserMessage() {
        await cop.proceed()
        await that.createLiveSharedMessage('user');
      },
      async updateLiveUserMessage(text) {
        await cop.proceed(text)
        await that.updateLiveSharedMessage(text, 'user');
      },
      async createLiveAssistantMessage(text) {
        await cop.proceed(text)
        await that.createLiveSharedMessage(text, 'user');
      },
      async updateLiveAssistantMessage(text) {
        await cop.proceed(text)
        await that.updateLiveSharedMessage(text, 'assistant');
      },
      async saveMessageToDb(message) {
        await cop.proceed(message)
        // Clear live message tracking and re-render
        that.currentLiveSharedMessageElement = null;
        await that.renderSharedMessages();
      }
    })
    this.LivelyAIWorkspaceLayer.beGlobal()
    
  }

  /*MD ## Shared Message Pane Rendering MD*/
  async renderSharedMessages() {
    if (!this.sharedMessagesPane || !this.workspaceId) return;

    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(this.workspaceId);
      if (!workspace) return;

      const allMessages = [];

      // Get audio messages from realtime component's database (old flat format)
      if (this.realtimeComponent && workspace.conversationId) {
        const OpenaiRealtimeChat = (await System.import('src/components/tools/openai-realtime-chat.js')).default;
        const audioMessages = await OpenaiRealtimeChat.conversationdb.messages
          .where('conversationId')
          .equals(workspace.conversationId)
          .sortBy('timestamp');

        allMessages.push(...audioMessages.map(m => ({
          ...m,
          source: 'audio',
          streamType: 'realtime',
          messageFormat: 'flat' // Mark as old flat format
        })));
      }

      // Get code messages from opencode component's memory (OpenCode format)
      if (this.opencodeComponent && workspace.opencodeSessionId) {
        const codeMessages = this.opencodeComponent.messages.get(workspace.opencodeSessionId) || [];
        allMessages.push(...codeMessages.map(m => ({
          ...m,
          source: 'code',
          streamType: 'opencode',
          messageFormat: 'opencode', // Mark as OpenCode format
          // Extract timestamp for sorting from OpenCode message structure
          timestamp: m.info?.time?.created || m.timestamp
        })));
      }

      // Sort by timestamp
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      console.log(`[AI Workspace] Rendering ${allMessages.length} messages (${allMessages.filter(m=>m.source==='audio').length} audio, ${allMessages.filter(m=>m.source==='code').length} code)`);

      // Clear and render
      this.sharedMessagesPane.innerHTML = '';
      for (const msg of allMessages) {
        const chatMessage = await lively.create('lively-chat-message');

        // Use appropriate method based on message format
        if (msg.messageFormat === 'opencode') {
          // OpenCode format with info/parts structure
          await chatMessage.setOpenCodeMessage(msg, {
            source: msg.source,
            streamType: msg.streamType
          });
        } else {
          // Flat format from realtime (role, content, timestamp)
          await chatMessage.setMessage(msg);
        }

        chatMessage.showDebug = this.showDebug;
        this.sharedMessagesPane.appendChild(chatMessage);
      }

      this.scrollSharedPaneToBottom(true);

    } catch (error) {
      console.error('[AI Workspace] Failed to render shared messages:', error);
    }
  }


  // Wrapper for base class method for backwards compatibility
  isSharedPaneAtBottom(threshold = 50) {
    return this.isAtBottom(this.sharedMessagesPane, threshold);
  }

  // Wrapper for base class method for backwards compatibility
  scrollSharedPaneToBottom(force = false) {
    this.scrollToBottom(this.sharedMessagesPane, force);
  }

  /*MD ## Live Message Updates MD*/
  async createLiveSharedMessage(role = 'assistant') {
    if (!this.sharedMessagesPane) return;

    // Create a new live message element
    this.currentLiveSharedMessageElement = await lively.create('lively-chat-message');
    this.currentLiveSharedMessageRole = role;

    const initialContent = role === 'user' ? '_Listening..._' : '';
    await this.currentLiveSharedMessageElement.setMessage({
      role: role,
      content: initialContent,
      source: 'audio',
      streamType: 'realtime'
    });
    this.currentLiveSharedMessageElement.showDebug = this.showDebug;

    this.sharedMessagesPane.appendChild(this.currentLiveSharedMessageElement);
    this.scrollSharedPaneToBottom();
  }

  async updateLiveSharedMessage(text, role = 'assistant') {
    if (!this.currentLiveSharedMessageElement) return;

    // Ensure we're updating the right role
    if (this.currentLiveSharedMessageRole !== role) {
      console.warn(`[AI Workspace] Role mismatch in live message update: expected ${this.currentLiveSharedMessageRole}, got ${role}`);
      return;
    }

    // Update the live message with new text
    await this.currentLiveSharedMessageElement.setMessage({
      role: role,
      content: text,
      source: 'audio',
      streamType: 'realtime'
    });
    this.scrollSharedPaneToBottom();
  }

  /*MD ## Message Query Methods MD*/

  async getWorkspaceEvents() {
    if (!this.workspaceId) return [];

    try {
      const events = await LivelyAiWorkspace.historydb.events
        .where('workspaceId')
        .equals(this.workspaceId)
        .sortBy('timestamp');

      return events;
    } catch (error) {
      console.error('[AI Workspace] Failed to get events:', error);
      return [];
    }
  }


  async getMessageCount(workspaceId, source) {
    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(workspaceId);
      if (!workspace) return 0;

      if (source === 'audio' && workspace.conversationId) {
        const OpenaiRealtimeChat = (await System.import('src/components/tools/openai-realtime-chat.js')).default;
        return await OpenaiRealtimeChat.conversationdb.messages
          .where('conversationId')
          .equals(workspace.conversationId)
          .count();
      } else if (source === 'code' && workspace.opencodeSessionId) {
        const messages = this.opencodeComponent?.messages.get(workspace.opencodeSessionId) || [];
        return messages.length;
      }

      return 0;
    } catch (error) {
      console.error('[AI Workspace] Failed to get message count:', error);
      return 0;
    }
  }

  /**
   * Get first user audio message for workspace (from realtime DB)
   */
  async getFirstUserAudioMessage(workspaceId) {
    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(workspaceId);
      if (!workspace || !workspace.conversationId) return null;

      const OpenaiRealtimeChat = (await System.import('src/components/tools/openai-realtime-chat.js')).default;
      const messages = await OpenaiRealtimeChat.conversationdb.messages
        .where('conversationId')
        .equals(workspace.conversationId)
        .sortBy('timestamp');

      const userMessages = messages.filter(m => m.role === 'user');
      return userMessages.length > 0 ? userMessages[0].content : null;
    } catch (error) {
      console.error('[AI Workspace] Failed to get first user audio message:', error);
      return null;
    }
  }


  async initializeComponents() {
    // Create OpenCode component
    try {
      this.opencodeComponent = await lively.create('lively-opencode');
      const opencodeContainer = this.get('#opencodeContainer');
      if (opencodeContainer) {
        opencodeContainer.appendChild(this.opencodeComponent);

        this.opencodeComponent.sessionUI = false;
        this.opencodeComponent.messagesUI = false;

        this.setupOpenCodeListeners();
        this.setupOpenCodeMessageCapture();
        this.updateOpenCodeStatus('Connected', true);
      }
    } catch (error) {
      console.error('Failed to create OpenCode component:', error);
      this.updateOpenCodeStatus('Error', false);
    }

    // Create Realtime Chat component
    try {
      this.realtimeComponent = await lively.create('openai-realtime-chat');
      const realtimeContainer = this.get('#realtimeContainer');
      if (realtimeContainer) {
        realtimeContainer.appendChild(this.realtimeComponent);

        this.realtimeComponent.sessionUI = false;
        this.realtimeComponent.messagesUI = false;

        // Configure as workspace bridge - focused on forwarding to coding agent
        this.realtimeComponent.setInstructions(await lively.files.loadFile(lively4url + "src/config/prompts/ai-workspace-audio-chat.txt"));

        this.realtimeComponent.setAvailableTools([
          'send_opencode_task',
          'get_opencode_status',
          'get_opencode_history',
          'create_opencode_session',
          'list_opencode_sessions'
        ]);

        this.setupRealtimeMessageCapture();
        this.updateRealtimeStatus('Ready', true);
      } else {
        console.error('Realtime container not found');
        this.updateRealtimeStatus('Container not found', false);
      }
    } catch (error) {
      console.error('Failed to create Realtime Chat component:', error);
      this.updateRealtimeStatus('Error', false);
    }

  }

  setupOpenCodeListeners() {
    // Listen for status changes from OpenCode component via CustomEvents
    if (!this.opencodeComponent) return;

    // Listen for opencode:status-change events
    this.opencodeComponent.addEventListener('opencode:status-change', (evt) => {
      const {type, sessionId, status, message, timestamp} = evt.detail;

      console.log('[AI Workspace] Received OpenCode status change:', evt.detail);

      // Update blackboard state
      this.blackboard.agentStatus = status;      
      this.blackboard.lastUpdate = timestamp;

      // Update current task from session if available
      if (this.opencodeComponent.currentSession) {
        this.blackboard.currentTask = this.opencodeComponent.currentSession.title || 'Untitled session';
      }

      
      // Update OpenCode status indicator
      if (status === 'working') {
        this.updateOpenCodeStatus('Working', true);
        const dotEl = this.get('#opencodeDot');
        if (dotEl) dotEl.classList.add('working');
      } else if (status === 'idle') {
        this.updateOpenCodeStatus('Idle', true);
        const dotEl = this.get('#opencodeDot');
        if (dotEl) dotEl.classList.remove('working');
      }

      // Check for completed requests when agent becomes idle
      if (status === 'idle' && type === 'session.idle') {
        this.checkAndCompleteRequests();
      }

      // Notify realtime chat component
      if (this.realtimeComponent && this.realtimeComponent.onAgentStatusChange) {
        this.realtimeComponent.onAgentStatusChange({
          status: status,
          message: message,
          eventType: type,
          task: this.blackboard.currentTask,
          timestamp: timestamp
        });
      }
    });

    // Also monitor connection status via polling (lightweight check)
    setInterval(() => {
      if (this.opencodeComponent) {
        const isConnected = this.opencodeComponent.connected;
        if (!isConnected) {
          this.updateOpenCodeStatus('Disconnected', false);
          this.blackboard.agentStatus = 'disconnected';
          this.blackboard.lastUpdate = Date.now();
        }
      }
    }, 5000); // Check connection every 5 seconds
  }

  /*MD ## Request-Response Correlation MD*/

  /**
   * Helper: Extract text content from OpenCode message format
   */
  extractMessageContent(opencodeMessage) {
    if (!opencodeMessage || !opencodeMessage.parts) {
      return '';
    }

    // Find all text parts and concatenate
    return opencodeMessage.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n');
  }

  checkAndCompleteRequests() {
    if (!this.opencodeComponent || !this.opencodeComponent.currentSession) {
      return;
    }

    const currentSessionId = this.opencodeComponent.currentSession.id;

    // Check each pending request
    for (const [requestId, request] of this.blackboard.pendingRequests.entries()) {
      // Only check requests for current session
      if (request.sessionId !== currentSessionId) {
        continue;
      }

      // Check if new messages have arrived since this request was sent
      const currentMessages = this.opencodeComponent.messages.get(currentSessionId) || [];

      if (currentMessages.length > request.initialMessageCount) {
        // Find the assistant's response (first new assistant message after the request)
        // UPDATED: Handle OpenCode message format with info.role
        let response = null;
        for (let i = request.initialMessageCount; i < currentMessages.length; i++) {
          const msg = currentMessages[i];
          const role = msg.info?.role || msg.role; // Handle both OpenCode and flat format
          if (role === 'assistant') {
            response = msg;
            break;
          }
        }

        if (response) {
          // Mark request as completed
          this.completeRequest(requestId, response);
        }
      }
    }
  }


  completeRequest(requestId, response) {
    const request = this.blackboard.pendingRequests.get(requestId);

    if (!request) {
      return; // Request not found
    }

    // UPDATED: Extract content from OpenCode message format
    const content = this.extractMessageContent(response);
    console.log(`[AI Workspace] Request ${requestId} completed:`, request.task, '→', content.substring(0, 100));

    // Move to completed requests
    this.blackboard.completedRequests.set(requestId, {
      task: request.task,
      response: response,
      responseContent: content, // Store extracted content for easy access
      timestamp: Date.now(),
      audioWaiting: request.audioWaiting
    });

    // Remove from pending
    this.blackboard.pendingRequests.delete(requestId);

    // Cleanup old completed requests (keep last 50)
    if (this.blackboard.completedRequests.size > 50) {
      const entries = Array.from(this.blackboard.completedRequests.entries());
      const toDelete = entries.slice(0, entries.length - 50);
      toDelete.forEach(([id]) => this.blackboard.completedRequests.delete(id));
    }
  }


  getRequestResponse(requestId) {
    const completed = this.blackboard.completedRequests.get(requestId);
    if (completed) {
      return completed.response;
    }

    // Check if request is still pending
    if (this.blackboard.pendingRequests.has(requestId)) {
      return null; // Still waiting
    }

    return null; // Request not found
  }


  setRequestAudioWaiting(requestId, waiting = true) {
    const request = this.blackboard.pendingRequests.get(requestId);
    if (request) {
      request.audioWaiting = waiting;
    }
  }

  /*MD ## Public API for Realtime Chat MD*/

  // #important
  async sendMessageToOpenCode(message, requestId = null) {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    if (!this.opencodeComponent.connected) {
      return {
        success: false,
        error: 'OpenCode not connected to server'
      };
    }

    try {
      // If no session exists, create one
      if (!this.opencodeComponent.currentSession) {
        await this.createOpenCodeSession(`Task: ${message.substring(0, 30)}...`);
      }

      // Track request if ID provided
      if (requestId) {
        this.blackboard.pendingRequests.set(requestId, {
          task: message,
          timestamp: Date.now(),
          status: 'sent',
          audioWaiting: false,
          sessionId: this.opencodeComponent.currentSession.id,
          initialMessageCount: (this.opencodeComponent.messages.get(this.opencodeComponent.currentSession.id) || []).length
        });
      }

      // Set the message in the input and send
      const input = this.opencodeComponent.get('#messageInput');
      if (input) {
        input.value = message;
        await this.opencodeComponent.onSendButton();
      }

      // Update blackboard
      this.blackboard.currentTask = message;
      this.blackboard.agentStatus = 'working';
      this.blackboard.lastUpdate = Date.now();
      this.blackboard.lastRequestId = requestId; // Track the last request ID

      return {
        success: true,
        message: 'Task sent to OpenCode agent',
        requestId: requestId
      };

    } catch (error) {
      console.error('Error sending message to OpenCode:', error);

      // Remove from pending requests on error
      if (requestId && this.blackboard.pendingRequests.has(requestId)) {
        this.blackboard.pendingRequests.delete(requestId);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

 
  getOpenCodeStatus() {
    if (!this.opencodeComponent) {
      return {
        available: false,
        error: 'OpenCode component not available'
      };
    }

    return {
      available: true,
      connected: this.opencodeComponent.connected,
      currentSession: this.opencodeComponent.currentSession,
      sessionCount: this.opencodeComponent.sessions?.length || 0,
      serverUrl: this.opencodeComponent.serverUrl,
      blackboard: this.blackboard
    };
  }


  /**
   * Get OpenCode message history
   * NOTE: Returns messages in OpenCode format (with info/parts structure)
   */
  async getOpenCodeHistory() {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    if (!this.opencodeComponent.currentSession) {
      return {
        success: false,
        error: 'No active session'
      };
    }

    try {
      const sessionId = this.opencodeComponent.currentSession.id;
      const messages = this.opencodeComponent.messages.get(sessionId) || [];

      return {
        success: true,
        sessionId: sessionId,
        messages: messages, // OpenCode format: {info: {id, role, time}, parts: [...]}
        messageFormat: 'opencode' // Indicate format for consumers
      };

    } catch (error) {
      console.error('Error getting OpenCode history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createOpenCodeSession(title) {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    try {
      // Create session using OpenCode's method
      const response = await fetch(`${this.opencodeComponent.serverUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title || `Session ${new Date().toLocaleTimeString()}`
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const newSession = await response.json();

      // Reload sessions and select the new one
      await this.opencodeComponent.loadSessions();
      this.opencodeComponent.selectSession(newSession);

      return {
        success: true,
        session: newSession
      };

    } catch (error) {
      console.error('Error creating OpenCode session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }



  getOpenCodeSessions() {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    return {
      success: true,
      sessions: this.opencodeComponent.sessions || []
    };
  }

  /*MD ## UI Update Methods MD*/

  updateOpenCodeStatus(text, connected) {
    const statusEl = this.get('#opencodeStatus');
    const dotEl = this.get('#opencodeDot');

    if (statusEl) {
      statusEl.textContent = `OpenCode: ${text}`;
    }

    if (dotEl) {
      if (connected) {
        dotEl.classList.add('connected');
        dotEl.classList.remove('working');
      } else {
        dotEl.classList.remove('connected');
        dotEl.classList.remove('working');
      }
    }
  }

  updateRealtimeStatus(text, connected) {
    const statusEl = this.get('#realtimeStatus');
    const dotEl = this.get('#realtimeDot');

    if (statusEl) {
      statusEl.textContent = `Realtime: ${text}`;
    }

    if (dotEl) {
      if (connected) {
        dotEl.classList.add('connected');
      } else {
        dotEl.classList.remove('connected');
      }
    }
  }

  /*MD ## Button Handlers MD*/

  async onNewSessionButton() {
    // Auto-create session without prompting
    const result = await this.createWorkspaceSession(null);

    if (result.success) {
      // Switch to the new session
      await this.switchWorkspaceSession(result.workspaceId);

      // Update sessions list
      await this.renderSessionsList();

      lively.success('New session created');
    } else {
      lively.error('Failed to create session', result.error);
    }
  }

  async renderSessionsList() {
    const sessionsList = this.get('#sessionsList');
    if (!sessionsList) return;

    const sessions = await this.listWorkspaceSessions();

    if (sessions.length === 0) {
      sessionsList.innerHTML = '<div class="empty-sessions">No sessions yet. Create one to get started!</div>';
      return;
    }

    // Get message counts and first user message for each session
    const sessionsWithData = await Promise.all(sessions.map(async session => {
      const audioCount = await this.getMessageCount(session.id, 'audio');
      const codeCount = await this.getMessageCount(session.id, 'code');
      const firstMessage = await this.getFirstUserAudioMessage(session.id);
      return { ...session, audioCount, codeCount, firstMessage };
    }));

    sessionsList.innerHTML = sessionsWithData.map(session => {
      const isActive = session.id === this.workspaceId;
      const createdDate = new Date(session.timestamp);
      const lastActivityDate = new Date(session.lastActivityTime);

      // Generate title from first user message if available
      let title = '';
      if (session.firstMessage) {
        const truncatedMessage = session.firstMessage.length > 50
          ? session.firstMessage.substring(0, 50) + '...'
          : session.firstMessage;
        title = truncatedMessage;
      } else {
        // Fallback to date-based title if no message
        title = this.generateSessionTitle(createdDate);
      }

      // Format creation date and time
      const dateTitle = this.generateSessionTitle(createdDate);
      const timeStr = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // Format last activity date and time
      const lastActivityDateTitle = this.generateSessionTitle(lastActivityDate);
      const lastActivityTimeStr = lastActivityDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const lastActivityDisplay = lastActivityDateTitle === dateTitle
        ? lastActivityTimeStr
        : `${lastActivityDateTitle} ${lastActivityTimeStr}`;

      return `
        <div class="session-item ${isActive ? 'active' : ''}" data-session-id="${session.id}">
          <div class="session-item-info">
            <div class="session-item-title">${title}</div>
            <div class="session-item-meta">
              ${dateTitle} ${timeStr} • <i class="fa fa-microphone"></i> ${session.audioCount} • <i class="fa fa-code"></i> ${session.codeCount}
            </div>
            <div class="session-item-meta">
              Last changed: ${lastActivityDisplay}
            </div>
          </div>
          <div class="session-item-actions">
            <button class="delete" data-session-id="${session.id}" title="Delete session">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Add delete button handlers first
    sessionsList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async (evt) => {
        evt.stopPropagation(); // Don't trigger session switch
        evt.preventDefault();

        const sessionId = btn.getAttribute('data-session-id');

        if (await lively.confirm('Delete this session? This will delete all messages and events.')) {
          const result = await this.deleteWorkspaceSession(sessionId);
          if (result.success) {
            await this.renderSessionsList();
            lively.success('Session deleted');
          } else {
            lively.error('Failed to delete session', result.error);
          }
        }
      });
    });

    // Add event listeners - click session to switch (but not delete button or actions area)
    sessionsList.querySelectorAll('.session-item').forEach(item => {
      item.addEventListener('click', async (evt) => {
        // Don't switch if clicking in the actions area or on delete button
        if (evt.target.closest('.session-item-actions') ||
            evt.target.closest('.delete')) {
          return;
        }

        const sessionId = item.getAttribute('data-session-id');

        // Don't switch if already active
        if (sessionId === this.workspaceId) return;

        await this.switchWorkspaceSession(sessionId);

        lively.success('Session switched');
      });
    });
  }

  async updateSessionUI() {
    // Called after switching sessions - refresh the sessions list to update active state
    await this.renderSessionsList();
    console.log('[AI Workspace] Session UI updated');
  }


  generateSessionTitle(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check if today, yesterday, or older
    if (sessionDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (sessionDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      // Format as "Mon, Jan 15" or "Jan 15, 2024" if different year
      const options = date.getFullYear() === now.getFullYear()
        ? { weekday: 'short', month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  }

  /*MD ## Context Menu MD*/
  // Override base class method to add component-specific menu items
  getContextMenuItems() {
    return [
      [" Show Audio Tools", () => {
        const hideAudioTools = this.getAttribute("hide-audio-tools") === "true";
        this.setAttribute("hide-audio-tools", hideAudioTools ? "false" : "true");
      }, "", this.generateToggleIcon(this.getAttribute("hide-audio-tools") !== "true")],
      [" Show Code Tools", () => {
        const hideCodeTools = this.getAttribute("hide-code-tools") === "true";
        this.setAttribute("hide-code-tools", hideCodeTools ? "false" : "true");
      }, "", this.generateToggleIcon(this.getAttribute("hide-code-tools") !== "true")]
    ];
  }
  
   /*MD ## Lifecycle Methods MD*/
  livelyMigrate(other) {
    this.blackboard = other.blackboard
    this.workspaceId = other.workspaceId || null;
  }

}
