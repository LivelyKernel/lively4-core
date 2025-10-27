import Morph from 'src/components/widgets/lively-morph.js';
import Dexie from "src/external/dexie3.js";
import { uuid as generateUuid } from 'utils';

/*MD
# [Lively AI Workspace](browse://doc/tools/ai-workspace.md)

MD*/

export default class LivelyAiWorkspace extends Morph {

  /*MD ## Database Schema MD*/

  // Unified chat history database - stores all messages from both audio and code agent
  static get historydb() {
    var db = new Dexie("lively-ai-workspace-history");
    db.version(1).stores({
      workspaces: 'id, timestamp, lastActivityTime, title',
      messages: '++id, workspaceId, timestamp, source, streamType, conversationId, sessionId, sequence',
      events: '++id, workspaceId, timestamp, eventType, source'
    }).upgrade(function () {});

    // Version 2: Add conversationId and opencodeSessionId to link subsessions
    db.version(2).stores({
      workspaces: 'id, timestamp, lastActivityTime, title, conversationId, opencodeSessionId',
      messages: '++id, workspaceId, timestamp, source, streamType, conversationId, sessionId, sequence',
      events: '++id, workspaceId, timestamp, eventType, source'
    }).upgrade(function () {});

    // Version 3: Add compound index for efficient message counting by source
    db.version(3).stores({
      workspaces: 'id, timestamp, lastActivityTime, title, conversationId, opencodeSessionId',
      messages: '++id, workspaceId, timestamp, source, streamType, conversationId, sessionId, sequence, [workspaceId+source], [workspaceId+timestamp]',
      events: '++id, workspaceId, timestamp, eventType, source'
    }).upgrade(function () {});

    return db;
  }
  async initialize() {
    this.windowTitle = "AI Workspace";
    this.registerButtons();

    // Initialize blackboard state
    this.blackboard = this.blackboard || {
      currentTask: null,
      agentStatus: 'idle',
      coordination: {},
      lastUpdate: Date.now(),
      pendingRequests: new Map(),    // Map<requestId, {task, timestamp, status, audioWaiting}>
      completedRequests: new Map()   // Map<requestId, {task, response, timestamp}>
    };

    // Component references
    this.opencodeComponent = null;
    this.realtimeComponent = null;

    // UI state
    this.blackboardVisible = false;

    // Shared message pane reference
    this.sharedMessagesPane = this.get('#sharedMessagesPane');

    // Initialize or restore workspace history session
    await this.initializeWorkspaceHistory();

    // Update UI
    this.updateStatusDisplay();
    this.updateBlackboardDisplay();

    // Initialize components programmatically
    await this.initializeComponents();

    // Render initial sessions list
    await this.renderSessionsList();

    // Render shared messages
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

  /**
   * Create a new workspace session with linked conversation and opencode session
   * @param {string} title - Session title
   * @returns {Promise<Object>} Result with workspace, conversation, and session IDs
   */
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
      // Note: title is always null - we generate display title from lastActivityTime
      await LivelyAiWorkspace.historydb.workspaces.add({
        id: workspaceId,
        timestamp: now.toISOString(),
        lastActivityTime: now.toISOString(),
        title: null,
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

  /**
   * Switch to a different workspace session (switches all linked subsessions)
   * @param {string} workspaceId - Workspace ID to switch to
   * @returns {Promise<Object>} Result
   */
  async switchWorkspaceSession(workspaceId) {
    try {
      // Load workspace record
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
          // Always use setConversation method which properly loads conversation data
          await this.realtimeComponent.setConversation(workspace.conversationId);
          console.log('[AI Workspace] Switched to conversation:', workspace.conversationId);
        } else {
          // Old workspace without conversationId - clear the display
          this.realtimeComponent.responses.innerHTML = '<div class="empty-chat">This is an old session without audio chat data. Create a new session to continue.</div>';
          console.warn('[AI Workspace] Workspace has no conversationId - old session format');
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

  /**
   * List all workspace sessions (sorted by creation date, newest first)
   * @returns {Promise<Array>} Array of workspace sessions
   */
  async listWorkspaceSessions() {
    try {
      const workspaces = await LivelyAiWorkspace.historydb.workspaces
        .orderBy('timestamp')
        .reverse()
        .toArray();

      return workspaces;

    } catch (error) {
      console.error('[AI Workspace] Failed to list workspace sessions:', error);
      return [];
    }
  }

  /**
   * Delete a workspace session (and optionally its linked subsessions)
   * @param {string} workspaceId - Workspace ID to delete
   * @returns {Promise<Object>} Result
   */
  async deleteWorkspaceSession(workspaceId) {
    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(workspaceId);

      if (!workspace) {
        return {
          success: false,
          error: 'Workspace not found'
        };
      }

      // Delete messages for this workspace
      await LivelyAiWorkspace.historydb.messages
        .where('workspaceId')
        .equals(workspaceId)
        .delete();

      // Delete events for this workspace
      await LivelyAiWorkspace.historydb.events
        .where('workspaceId')
        .equals(workspaceId)
        .delete();

      // Delete workspace record
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

  async updateWorkspaceActivity() {
    if (!this.workspaceId) return;
    try {
      await LivelyAiWorkspace.historydb.workspaces.update(this.workspaceId, {
        lastActivityTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update workspace activity:', error);
    }
  }

  /*MD ## Message Capture and Storage MD*/

  /**
   * Store a message in the unified history
   * @param {Object} messageData - Message data with source-specific metadata
   */
  async storeMessage(messageData) {
    if (!this.workspaceId) {
      console.warn('[AI Workspace] No workspace ID, skipping message storage');
      return;
    }

    try {
      const {
        source,           // 'audio' or 'code'
        streamType,       // 'realtime' or 'opencode'
        role,             // 'user', 'assistant', 'tool'
        content,          // Message content
        type,             // Message type (e.g., 'message', 'function_call', 'text')
        metadata,         // Source-specific metadata
        conversationId,   // For audio chat messages
        sessionId,        // For code agent messages
        sequence,         // Message sequence number (if available)
        timestamp         // Message timestamp
      } = messageData;

      // Store timestamp in ISO 8601 format (includes timezone)
      const timestampISO = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

      await LivelyAiWorkspace.historydb.messages.add({
        workspaceId: this.workspaceId,
        timestamp: timestampISO,
        source: source,
        streamType: streamType,
        role: role,
        content: content,
        type: type || 'message',
        metadata: metadata || {},
        conversationId: conversationId || null,
        sessionId: sessionId || null,
        sequence: sequence || null
      });

      // Update workspace activity
      await this.updateWorkspaceActivity();

      // Update session list to reflect new message count
      await this.renderSessionsList();

      console.log(`[AI Workspace] Stored ${source} message:`, {role, type, contentLength: content?.length});

    } catch (error) {
      console.error('[AI Workspace] Failed to store message:', error);
    }
  }

  /**
   * Store an event in the unified history
   * @param {Object} eventData - Event data
   */
  async storeEvent(eventData) {
    if (!this.workspaceId) return;

    try {
      const {
        source,       // 'audio' or 'code'
        eventType,    // Event type (e.g., 'status_change', 'session_idle')
        data          // Event-specific data
      } = eventData;

      await LivelyAiWorkspace.historydb.events.add({
        workspaceId: this.workspaceId,
        timestamp: new Date().toISOString(),
        eventType: eventType,
        source: source,
        data: data || {}
      });

      console.log(`[AI Workspace] Stored ${source} event:`, eventType);

    } catch (error) {
      console.error('[AI Workspace] Failed to store event:', error);
    }
  }

  /*MD ## Shared Message Pane Rendering MD*/

  /**
   * Render all messages from current workspace in shared pane
   */
  async renderSharedMessages() {
    if (!this.sharedMessagesPane || !this.workspaceId) return;

    // Clear existing messages
    this.sharedMessagesPane.innerHTML = '';

    try {
      // Fetch all messages for current workspace, sorted by timestamp
      const messages = await LivelyAiWorkspace.historydb.messages
        .where('workspaceId')
        .equals(this.workspaceId)
        .sortBy('timestamp');

      console.log(`[AI Workspace] Rendering ${messages.length} messages in shared pane`);

      // Render each message
      for (const msg of messages) {
        await this.createMessageComponent(msg);
      }

      // Scroll to bottom initially
      this.scrollSharedPaneToBottom(true);

    } catch (error) {
      console.error('[AI Workspace] Failed to render shared messages:', error);
    }
  }

  /**
   * Append a single message to the shared pane (for live updates)
   */
  async appendMessageToSharedPane(messageData) {
    if (!this.sharedMessagesPane) return;

    try {
      // Check if we're at bottom before adding (for smart scroll)
      const wasAtBottom = this.isSharedPaneAtBottom();

      // Create and append message component
      await this.createMessageComponent(messageData);

      // Smart scroll: only auto-scroll if user was at bottom
      if (wasAtBottom) {
        this.scrollSharedPaneToBottom(false);
      }

    } catch (error) {
      console.error('[AI Workspace] Failed to append message:', error);
    }
  }

  /**
   * Create a message component and append to shared pane
   */
  async createMessageComponent(messageData) {
    const chatMessage = await lively.create('lively-chat-message');
    await chatMessage.setMessage(messageData);
    this.sharedMessagesPane.appendChild(chatMessage);
  }

  /**
   * Check if shared pane is scrolled to bottom (within threshold)
   */
  isSharedPaneAtBottom(threshold = 50) {
    if (!this.sharedMessagesPane) return true;

    const { scrollTop, scrollHeight, clientHeight } = this.sharedMessagesPane;
    return (scrollHeight - scrollTop - clientHeight) < threshold;
  }

  /**
   * Scroll shared pane to bottom
   * @param {boolean} force - If true, always scroll. If false, only scroll if at bottom
   */
  scrollSharedPaneToBottom(force = false) {
    if (!this.sharedMessagesPane) return;

    if (force || this.isSharedPaneAtBottom()) {
      // Small delay to ensure message is rendered
      setTimeout(() => {
        if (this.sharedMessagesPane) {
          this.sharedMessagesPane.scrollTop = this.sharedMessagesPane.scrollHeight;
        }
      }, 10);
    }
  }

  /*MD ## Message Query Methods MD*/

  /**
   * Get all messages for this workspace
   * @returns {Promise<Array>} Array of messages
   */
  async getWorkspaceMessages() {
    if (!this.workspaceId) return [];

    try {
      const messages = await LivelyAiWorkspace.historydb.messages
        .where('workspaceId')
        .equals(this.workspaceId)
        .sortBy('timestamp'); // ISO timestamps sort correctly lexicographically

      return messages;
    } catch (error) {
      console.error('[AI Workspace] Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Get messages filtered by source
   * @param {string} source - 'audio' or 'code'
   * @returns {Promise<Array>} Array of messages
   */
  async getMessagesBySource(source) {
    if (!this.workspaceId) return [];

    try {
      const messages = await LivelyAiWorkspace.historydb.messages
        .where('[workspaceId+source]')
        .equals([this.workspaceId, source])
        .sortBy('timestamp'); // ISO timestamps sort correctly lexicographically

      return messages;
    } catch (error) {
      console.error('[AI Workspace] Failed to get messages by source:', error);
      return [];
    }
  }

  /**
   * Get all events for this workspace
   * @returns {Promise<Array>} Array of events
   */
  async getWorkspaceEvents() {
    if (!this.workspaceId) return [];

    try {
      const events = await LivelyAiWorkspace.historydb.events
        .where('workspaceId')
        .equals(this.workspaceId)
        .sortBy('timestamp'); // ISO timestamps sort correctly lexicographically

      return events;
    } catch (error) {
      console.error('[AI Workspace] Failed to get events:', error);
      return [];
    }
  }

  /**
   * Get message count for a workspace by source
   * @param {string} workspaceId - Workspace ID
   * @param {string} source - Message source ('audio' or 'code')
   * @returns {Promise<number>} Count of messages
   */
  async getMessageCount(workspaceId, source) {
    try {
      const count = await LivelyAiWorkspace.historydb.messages
        .where('[workspaceId+source]')
        .equals([workspaceId, source])
        .count();

      return count;
    } catch (error) {
      console.error('[AI Workspace] Failed to get message count:', error);
      return 0;
    }
  }

  /**
   * Get the first user audio message for a workspace (for session titles)
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<string|null>} First user audio message content or null
   */
  async getFirstUserAudioMessage(workspaceId) {
    try {
      const messages = await LivelyAiWorkspace.historydb.messages
        .where('[workspaceId+timestamp]')
        .between([workspaceId, Dexie.minKey], [workspaceId, Dexie.maxKey])
        .toArray();

      // Filter for user audio messages and find the first one
      const userAudioMessages = messages.filter(m => m.source === 'audio' && m.role === 'user');

      if (userAudioMessages.length > 0) {
        // Sort by timestamp to ensure we get the first one
        userAudioMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return userAudioMessages[0].content || null;
      }

      return null;
    } catch (error) {
      console.error('[AI Workspace] Failed to get first user audio message:', error);
      return null;
    }
  }

  /**
   * Export workspace history as JSON
   * @returns {Promise<Object>} Complete workspace data
   */
  async exportWorkspaceHistory() {
    if (!this.workspaceId) {
      return {success: false, error: 'No workspace ID'};
    }

    try {
      const workspace = await LivelyAiWorkspace.historydb.workspaces.get(this.workspaceId);
      const messages = await this.getWorkspaceMessages();
      const events = await this.getWorkspaceEvents();

      return {
        success: true,
        workspace: workspace,
        messages: messages,
        events: events,
        exportTime: Date.now()
      };
    } catch (error) {
      console.error('[AI Workspace] Failed to export history:', error);
      return {success: false, error: error.message};
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

        // Configure as workspace bridge - focused on forwarding to coding agent
        this.realtimeComponent.setInstructions(
          "You are a voice interface helping the user communicate with a coding agent (Claude Code). " +
          "Your role is to:\n" +
          "1. Listen to the user's requests and forward coding tasks to the agent using send_opencode_task\n" +
          "2. Relay the agent's responses back to the user naturally and conversationally\n" +
          "3. You'll be automatically notified when the agent finishes - just relay what they said\n" +
          "4. For quick questions (like 'what is 3+4'), you'll get immediate answers to share\n" +
          "5. Focus on being a helpful bridge - don't try to solve coding problems yourself\n\n" +
          "Keep responses brief and natural. When relaying agent responses, paraphrase if they're very long.\n\n" +
          "Clarification: 'lively' refers to the Lively4 environment, not tone or style."
        );

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

      // Try to find it anyway in case it was created but threw error
      const realtimeContainer = this.get('#realtimeContainer');
      if (realtimeContainer && realtimeContainer.firstElementChild) {
        console.warn('Realtime component found in container despite error, using it');
        this.realtimeComponent = realtimeContainer.firstElementChild;

        // Hide session UI - workspace manages sessions
        this.realtimeComponent.hideSessionUI = true;

        // Still configure it even if recovered
        this.realtimeComponent.setInstructions(
          "You are a voice interface helping the user communicate with a coding agent (Claude Code). " +
          "Your role is to:\n" +
          "1. Listen to the user's requests and forward coding tasks to the agent using send_opencode_task\n" +
          "2. Relay the agent's responses back to the user naturally and conversationally\n" +
          "3. You'll be automatically notified when the agent finishes - just relay what they said\n" +
          "4. For quick questions (like 'what is 3+4'), you'll get immediate answers to share\n" +
          "5. Focus on being a helpful bridge - don't try to solve coding problems yourself\n\n" +
          "Keep responses brief and natural. When relaying agent responses, paraphrase if they're very long.\n\n" +
          "Clarification: 'lively' refers to the Lively4 environment, not tone or style."
        );

        this.realtimeComponent.setAvailableTools([
          'send_opencode_task',
          'get_opencode_status',
          'get_opencode_history',
          'create_opencode_session',
          'list_opencode_sessions'
        ]);

        this.setupRealtimeMessageCapture();
        this.updateRealtimeStatus('Ready (recovered)', true);
      }
    }
  }

  /*MD ## Message Capture from Components MD*/

  /**
   * Setup message capture from OpenCode component
   * Hooks into the component to capture all messages as they're added
   */
  setupOpenCodeMessageCapture() {
    if (!this.opencodeComponent) return;

    // Track last message count to detect new messages per session
    this.lastOpenCodeMessageCount = new Map(); // sessionId -> count

    // Override selectSession to reset message count when switching sessions
    const originalSelectSession = this.opencodeComponent.selectSession.bind(this.opencodeComponent);
    this.opencodeComponent.selectSession = async (session) => {
      // Call original
      await originalSelectSession(session);

      // Reset message count for this session (will process all messages)
      this.lastOpenCodeMessageCount.set(session.id, 0);

      console.log('[AI Workspace] Session switched, reset message count for:', session.id);
    };

    // Override displayMessages to capture all messages (including tool calls from API)
    const originalDisplayMessages = this.opencodeComponent.displayMessages.bind(this.opencodeComponent);
    this.opencodeComponent.displayMessages = async () => {
      // Call original to update the component's display
      await originalDisplayMessages();

      // Get current messages for the session
      if (this.opencodeComponent.currentSession) {
        const sessionId = this.opencodeComponent.currentSession.id;
        const messages = this.opencodeComponent.messages.get(sessionId) || [];

        // Get last count for this session
        const lastCount = this.lastOpenCodeMessageCount.get(sessionId) || 0;

        // Check if there are new messages since last check
        if (messages.length > lastCount) {
          // Process only new messages
          const newMessages = messages.slice(lastCount);

          for (const msg of newMessages) {
            const messageData = {
              source: 'code',
              streamType: 'opencode',
              role: msg.role,
              content: msg.content,
              type: msg.type || 'text',
              metadata: msg.metadata || {},
              sessionId: sessionId,
              timestamp: msg.timestamp || Date.now()
            };

            // Store in unified history
            await this.storeMessage(messageData);

            // Append to shared pane
            await this.appendMessageToSharedPane(messageData);
          }

          this.lastOpenCodeMessageCount.set(sessionId, messages.length);
        }
      }
    };

    // Also override addMessage for immediate user messages
    const originalAddMessage = this.opencodeComponent.addMessage.bind(this.opencodeComponent);
    this.opencodeComponent.addMessage = (sessionId, role, content) => {
      // Call original method
      originalAddMessage(sessionId, role, content);

      // Increment count for this session
      const currentCount = this.lastOpenCodeMessageCount.get(sessionId) || 0;
      this.lastOpenCodeMessageCount.set(sessionId, currentCount + 1);

      const messageData = {
        source: 'code',
        streamType: 'opencode',
        role: role,
        content: content,
        type: 'text',
        sessionId: sessionId,
        timestamp: Date.now()
      };

      // Store and display immediately
      this.storeMessage(messageData);
      this.appendMessageToSharedPane(messageData);
    };

    console.log('[AI Workspace] OpenCode message capture enabled');
  }

  /**
   * Setup message capture from Realtime Chat component
   * Hooks into the saveMessageToDb method to capture messages
   */
  setupRealtimeMessageCapture() {
    if (!this.realtimeComponent) return;

    // Track live streaming messages
    this.currentLiveUserMessage = null;
    this.currentLiveAssistantMessage = null;

    // Override live user message creation
    const originalCreateLiveUser = this.realtimeComponent.createLiveUserMessage.bind(this.realtimeComponent);
    this.realtimeComponent.createLiveUserMessage = async () => {
      // Call original to maintain internal state
      await originalCreateLiveUser();

      // Create live message in shared pane
      this.currentLiveUserMessage = await lively.create('lively-chat-message');
      await this.currentLiveUserMessage.setMessage({
        role: 'user',
        content: '_Listening..._',
        source: 'audio',
        streamType: 'realtime',
        sequence: this.realtimeComponent.messageSequence
      });

      const wasAtBottom = this.isSharedPaneAtBottom();
      this.sharedMessagesPane.appendChild(this.currentLiveUserMessage);
      if (wasAtBottom) this.scrollSharedPaneToBottom(false);
    };

    // Override live user message updates
    const originalUpdateLiveUser = this.realtimeComponent.updateLiveUserMessage.bind(this.realtimeComponent);
    this.realtimeComponent.updateLiveUserMessage = async (text) => {
      // Call original
      await originalUpdateLiveUser(text);

      // Update our shared pane message
      if (this.currentLiveUserMessage) {
        await this.currentLiveUserMessage.setMessage({
          role: 'user',
          content: text,
          source: 'audio',
          streamType: 'realtime',
          sequence: this.realtimeComponent.messageSequence
        });
        const wasAtBottom = this.isSharedPaneAtBottom();
        if (wasAtBottom) this.scrollSharedPaneToBottom(false);
      }
    };

    // Override live assistant message creation
    const originalCreateLiveAssistant = this.realtimeComponent.createLiveAssistantMessage.bind(this.realtimeComponent);
    this.realtimeComponent.createLiveAssistantMessage = async () => {
      // Call original
      await originalCreateLiveAssistant();

      // Create live message in shared pane
      this.currentLiveAssistantMessage = await lively.create('lively-chat-message');
      await this.currentLiveAssistantMessage.setMessage({
        role: 'assistant',
        content: '',
        source: 'audio',
        streamType: 'realtime',
        sequence: this.realtimeComponent.messageSequence
      });

      const wasAtBottom = this.isSharedPaneAtBottom();
      this.sharedMessagesPane.appendChild(this.currentLiveAssistantMessage);
      if (wasAtBottom) this.scrollSharedPaneToBottom(false);
    };

    // Override live assistant message updates
    const originalUpdateLiveAssistant = this.realtimeComponent.updateLiveAssistantMessage.bind(this.realtimeComponent);
    this.realtimeComponent.updateLiveAssistantMessage = async (text) => {
      // Call original
      await originalUpdateLiveAssistant(text);

      // Update our shared pane message
      if (this.currentLiveAssistantMessage) {
        await this.currentLiveAssistantMessage.setMessage({
          role: 'assistant',
          content: text,
          source: 'audio',
          streamType: 'realtime',
          sequence: this.realtimeComponent.messageSequence
        });
        const wasAtBottom = this.isSharedPaneAtBottom();
        if (wasAtBottom) this.scrollSharedPaneToBottom(false);
      }
    };

    // Override the saveMessageToDb method to capture final messages
    const originalSaveMessage = this.realtimeComponent.saveMessageToDb.bind(this.realtimeComponent);
    this.realtimeComponent.saveMessageToDb = async (message) => {
      // Call original method
      await originalSaveMessage(message);

      const messageData = {
        source: 'audio',
        streamType: 'realtime',
        role: message.role,
        content: message.content,
        type: message.type || 'message',
        metadata: message.metadata || {},
        conversationId: this.realtimeComponent.currentConversationId,
        sequence: message.sequence,
        timestamp: message.timestamp || Date.now() // Preserve original creation timestamp
      };

      // Capture message to unified history
      await this.storeMessage(messageData);

      // For tool messages and non-live messages, append to shared pane
      if (message.role === 'tool') {
        // Tool messages should always be appended since they're not live-streamed
        await this.appendMessageToSharedPane(messageData);
      } else if (message.role === 'user') {
        // Clear live user message reference
        this.currentLiveUserMessage = null;
      } else if (message.role === 'assistant') {
        // Clear live assistant message reference
        this.currentLiveAssistantMessage = null;
      }

      // Note: For user/assistant, we don't append here because the live message
      // is already in the pane and has been updated with the final content
    };

    console.log('[AI Workspace] Realtime Chat message capture enabled');
  }

  setupOpenCodeListeners() {
    // Listen for status changes from OpenCode component via CustomEvents
    if (!this.opencodeComponent) return;

    // Listen for opencode:status-change events
    this.opencodeComponent.addEventListener('opencode:status-change', (evt) => {
      const {type, sessionId, status, message, timestamp} = evt.detail;

      console.log('[AI Workspace] Received OpenCode status change:', evt.detail);

      // Store event in unified history
      this.storeEvent({
        source: 'code',
        eventType: type,
        data: {
          sessionId: sessionId,
          status: status,
          message: message,
          timestamp: timestamp
        }
      });

      // Update blackboard state
      this.blackboard.agentStatus = status;
      this.blackboard.lastEventType = type;
      this.blackboard.lastEventMessage = message;
      this.blackboard.lastUpdate = timestamp;

      // Update current task from session if available
      if (this.opencodeComponent.currentSession) {
        this.blackboard.currentTask = this.opencodeComponent.currentSession.title || 'Untitled session';
      }

      // Update UI
      this.updateBlackboardDisplay();

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
          this.updateBlackboardDisplay();
        }
      }
    }, 5000); // Check connection every 5 seconds
  }

  // ===================================================================
  // Request-Response Correlation
  // ===================================================================

  /**
   * Check pending requests and mark them complete if responses have arrived
   */
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
        let response = null;
        for (let i = request.initialMessageCount; i < currentMessages.length; i++) {
          if (currentMessages[i].role === 'assistant') {
            response = currentMessages[i];
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

  /**
   * Mark a request as completed with its response
   */
  completeRequest(requestId, response) {
    const request = this.blackboard.pendingRequests.get(requestId);

    if (!request) {
      return; // Request not found
    }

    console.log(`[AI Workspace] Request ${requestId} completed:`, request.task, '→', response.content);

    // Move to completed requests
    this.blackboard.completedRequests.set(requestId, {
      task: request.task,
      response: response,
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

    this.updateBlackboardDisplay();
  }

  /**
   * Get response for a specific request ID
   * @param {string} requestId - Request ID to check
   * @returns {Object|null} Response object or null if not yet complete
   */
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

  /**
   * Set audio waiting flag for a request
   */
  setRequestAudioWaiting(requestId, waiting = true) {
    const request = this.blackboard.pendingRequests.get(requestId);
    if (request) {
      request.audioWaiting = waiting;
    }
  }

  // ===================================================================
  // Public API for Realtime Chat
  // ===================================================================

  /**
   * Send a message or task to the OpenCode agent
   * @param {string} message - The message or task to send
   * @param {string} requestId - Optional request ID for tracking request-response correlation
   * @returns {Promise<Object>} Response with status
   */
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
      this.updateBlackboardDisplay();

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

  /**
   * Get current status of OpenCode agent
   * @returns {Object} Status information
   */
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
   * Get conversation history from current OpenCode session
   * @returns {Promise<Array>} Message history
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
        messages: messages
      };

    } catch (error) {
      console.error('Error getting OpenCode history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new OpenCode session
   * @param {string} title - Session title
   * @returns {Promise<Object>} New session information
   */
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

  /**
   * Switch to a different OpenCode session
   * @param {string} sessionId - Session ID to switch to
   * @returns {Promise<Object>} Result
   */
  async switchOpenCodeSession(sessionId) {
    if (!this.opencodeComponent) {
      return {
        success: false,
        error: 'OpenCode component not available'
      };
    }

    try {
      const session = this.opencodeComponent.sessions.find(s => s.id === sessionId);

      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      await this.opencodeComponent.selectSession(session);

      return {
        success: true,
        session: session
      };

    } catch (error) {
      console.error('Error switching OpenCode session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get list of all OpenCode sessions
   * @returns {Array} List of sessions
   */
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

  // ===================================================================
  // UI Update Methods
  // ===================================================================

  updateStatusDisplay() {
    // Will be called when status changes
  }

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

  updateBlackboardDisplay() {
    const contentEl = this.get('#blackboardContent');
    if (!contentEl) return;

    const blackboardText = JSON.stringify(this.blackboard, null, 2);
    contentEl.textContent = blackboardText;
  }

  // ===================================================================
  // Button Handlers
  // ===================================================================

  onToggleBlackboardButton() {
    this.blackboardVisible = !this.blackboardVisible;

    const panel = this.get('#blackboardPanel');
    if (panel) {
      if (this.blackboardVisible) {
        panel.classList.remove('collapsed');
      } else {
        panel.classList.add('collapsed');
      }
    }
  }

  onClearButton() {
    // Clear blackboard state
    this.blackboard = {
      currentTask: null,
      agentStatus: 'idle',
      coordination: {},
      lastUpdate: Date.now()
    };

    this.updateBlackboardDisplay();
    lively.notify('Workspace cleared');
  }

  async onExportHistoryButton() {
    const result = await this.exportWorkspaceHistory();

    if (!result.success) {
      lively.error('Failed to export history: ' + result.error);
      return;
    }

    // Convert to JSONL format (one JSON object per line) for easy processing
    const jsonl = [
      JSON.stringify({type: 'workspace', ...result.workspace}),
      ...result.messages.map(m => JSON.stringify({type: 'message', ...m})),
      ...result.events.map(e => JSON.stringify({type: 'event', ...e}))
    ].join('\n');

    // Copy to clipboard
    navigator.clipboard.writeText(jsonl);
    lively.success('History exported', `${result.messages.length} messages, ${result.events.length} events copied to clipboard`);
  }

  async onViewHistoryButton() {
    const result = await this.exportWorkspaceHistory();

    if (!result.success) {
      lively.error('Failed to load history: ' + result.error);
      return;
    }

    // Open inspector on the exported JSON object
    lively.openInspector(result, null, 'Workspace History');

    lively.success('History loaded', `${result.messages.length} messages, ${result.events.length} events`);
  }

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

  /**
   * Generate human-readable session title from date
   * @param {Date} date - Date to generate title from
   * @returns {string} Human-readable title
   */
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


  // ===================================================================
  // Lifecycle Methods
  // ===================================================================

  livelyPreMigrate() {
    // Cleanup before migration
  }

  livelyMigrate(other) {
    // Preserve state during live updates
    this.blackboard = other.blackboard || {
      currentTask: null,
      agentStatus: 'idle',
      coordination: {},
      lastUpdate: Date.now()
    };

    this.blackboardVisible = other.blackboardVisible || false;

    // Preserve workspace ID for history tracking
    this.workspaceId = other.workspaceId || null;

    // Update displays
    this.updateBlackboardDisplay();
    this.updateStatusDisplay();
  }

  async livelyExample() {
    this.style.backgroundColor = "white";
    this.style.border = "2px solid #667eea";
  }
}
