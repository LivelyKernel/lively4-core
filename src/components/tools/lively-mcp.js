import Morph from 'src/components/widgets/lively-morph.js';
import {  uuid as generateUUID } from 'utils';
import { Tools } from 'src/client/mcp-tools.js';
/*MD 
# Lively MCP Agent

Model Context Protocol (MCP) agent component that establishes a bridge between Claude Code and the live Lively4 development environment.

**Architecture:**
- WebSocket connection to lively4-server at `/_mcp-session`
- Unique session ID for multi-user support
- Code evaluation capabilities using SystemJS
- Real-time activity logging and status monitoring

**Flow:**
1. Component generates unique session ID and connects to server
2. Server registers session and provides MCP endpoint to Claude Code  
3. Claude Code sends `evaluate_code` requests via MCP protocol
4. Server forwards requests to browser via WebSocket
5. Browser evaluates code and returns results

<div style="width:1000px"></div>

```mermaid
sequenceDiagram
    participant Claude as Claude Code
    participant Server as Lively4-Server MCP
    participant Browser as lively-mcp Component
    participant Env as Lively4 Environment
    
    Browser->>Server: WebSocket connect /_mcp-session
    Browser->>Server: register sessionId
    Server->>Browser: session registered
    
    Claude->>Server: MCP evaluate_code(sessionId, code)
    Server->>Browser: WebSocket eval request
    Browser->>Env: System.import() / eval()
    Env->>Browser: execution result
    Browser->>Server: WebSocket response
    Server->>Claude: MCP tool response
```

MD*/

export default class LivelyMcp extends Morph {
  async initialize() {
    this.windowTitle = "MCP Agent";
    this.registerButtons();
    
    // Initialize session properties
    this.sessionId = generateUUID();
    this.logs = [];
    this.maxLogs = 100;
    this.shouldReconnect = true;
    
    // Update UI with session info
    this.updateSessionInfo();
    
    this.updateStatus('Initializing...', false);
  }
  
  connectedCallback() {
    this.shouldReconnect = true;
    this.connectToMcpServer();
  }
  
  disconnectedCallback() {
    this.disconnectFromMcpServer();
  }
  
  updateSessionInfo() {
    const sessionIdEl = this.get('#sessionId');
    if (sessionIdEl) {
      sessionIdEl.textContent = this.sessionId.substring(0, 8) + '...';
      sessionIdEl.title = this.sessionId;
    }
  }
  
  get defaultServerURL() {
    return lively4url.match(/(.*)\/([^\/]+$)/)[1];
  }
  
  connectToMcpServer() {
    // Use wss:// for https:// and ws:// for http://
    const protocol = this.defaultServerURL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = this.defaultServerURL.replace(/^https?/, protocol) + '/_mcp-session';
    this.updateStatus('Connecting...', false);
    this.logActivity('info', `Connecting to MCP server at ${wsUrl}...`);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        if (this.ws.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket onopen fired but readyState is not OPEN:', this.ws.readyState);
          return;
        }
        
        this.updateStatus('Connected', true);
        this.logActivity('info', `Connected to MCP server (Session: ${this.sessionId.substring(0, 8)})`);
        
        // Register this session with the server
        this.ws.send(JSON.stringify({
          type: 'register-session',
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        }));
        
        lively.success('MCP Agent connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMcpMessage(message);
        } catch (error) {
          console.error('Error parsing MCP message:', error);
          this.logActivity('error', `Failed to parse message: ${error.message}`);
        }
      };
      
      this.ws.onclose = () => {
        this.updateStatus('Disconnected', false);
        this.logActivity('info', 'Disconnected from MCP server');
        
        // Auto-reconnect after 3 seconds if not intentionally disconnected
        if (this.shouldReconnect) {
          setTimeout(() => {
            this.logActivity('info', 'Attempting to reconnect...');
            this.connectToMcpServer();
          }, 3000);
        }
      };
      
      this.ws.onerror = (error) => {
        this.updateStatus('Error', false);
        this.logActivity('error', `WebSocket error: ${error.message || 'Connection failed'}`);
        console.error('MCP WebSocket error:', error);
      };
      
    } catch (error) {
      this.updateStatus('Failed', false);
      this.logActivity('error', `Connection failed: ${error.message}`);
      console.error('Failed to connect to MCP server:', error);
    }
  }
  
  disconnectFromMcpServer() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.updateStatus('Disconnected', false);
      this.logActivity('info', 'MCP Agent disconnected');
    }
  }
  
  updateStatus(text, connected) {
    const statusEl = this.get('#status');
    const statusDot = this.get('#statusDot');
    
    if (statusEl) {
      statusEl.textContent = text;
    }
    
    if (statusDot) {
      if (connected) {
        statusDot.classList.add('connected');
      } else {
        statusDot.classList.remove('connected');
      }
    }
  }
  
  async handleMcpMessage(message) {
    this.logActivity('request', `Received: ${message.type}`);
    
    switch (message.type) {
      case 'session-registered':
        this.logActivity('info', 'Session registered successfully');
        break;
        
      case 'evaluate-code':
        await this.handleToolExecution(message);
        break;
        
      case 'ping':
        // Respond to server ping to keep connection alive
        this.ws.send(JSON.stringify({
          type: 'pong',
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        }));
        break;
        
      default:
        // Try to handle as a generic tool call
        if (message.requestId) {
          await this.handleToolExecution(message);
        } else {
          this.logActivity('info', `Unknown message type: ${message.type}`);
        }
        break;
    }
  }
  
  async handleToolExecution(message) {
    const { type: messageType, requestId } = message;
    
    let result;
    let success = true;
    
    try {
      // Use the Tools object from mcp-tools.js
      const tool = Tools[messageType];
      if (tool && tool.execute) {
        // Create context object for the tool
        const context = {
          sessionId: this.sessionId,
          logActivity: (type, message) => this.logActivity(type, message)
        };
        
        result = await tool.execute(message, context);
      } else {
        // Fallback: Try to find a custom tool handler on this component
        const handlerMethod = `handle${messageType.split('-').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join('')}Tool`;
        
        if (this[handlerMethod] && typeof this[handlerMethod] === 'function') {
          result = await this[handlerMethod](message);
        } else {
          throw new Error(`No handler found for tool type: ${messageType}`);
        }
      }
      
      this.logActivity('response', `${messageType} success: ${String(result).substring(0, 100)}...`);
      
    } catch (error) {
      success = false;
      result = `Error: ${error.message}`;
      this.logActivity('error', `${messageType} failed: ${error.message}`);
    }
    
    // Send response back to server
    const response = {
      type: 'tool-result',
      requestId,
      sessionId: this.sessionId,
      success,
      result,
      timestamp: new Date().toISOString()
    };
    
    this.ws.send(JSON.stringify(response));
    
    // Also display result in UI
    this.displayToolResult(messageType, message, result, success);
  }


  // Legacy compatibility method
  async handleCodeEvaluation(message) {
    return await this.handleToolExecution(message);
  }
  
  displayToolResult(messageType, message, result, success) {
    const logContainer = this.get('#logContainer');
    if (!logContainer) return;
    
    // Remove empty message if present
    const emptyLog = logContainer.querySelector('.empty-log');
    if (emptyLog) {
      emptyLog.remove();
    }
    
    // Create display content based on tool type
    let content;
    if (messageType === 'evaluate-code') {
      content = [
        <div style="font-weight: bold; margin-bottom: 4px;">Code:</div>,
        <div style="margin-bottom: 8px;">{message.code}</div>,
        <div style="font-weight: bold; margin-bottom: 4px;">Result:</div>,
        <div>{result}</div>
      ];
    } else {
      content = [
        <div style="font-weight: bold; margin-bottom: 4px;">Tool: {messageType}</div>,
        <div style="margin-bottom: 8px;">{JSON.stringify(message, null, 2)}</div>,
        <div style="font-weight: bold; margin-bottom: 4px;">Result:</div>,
        <div>{result}</div>
      ];
    }
    
    const resultEl = <div class={`eval-result ${success ? 'success' : 'error'}`}>
      {content}
    </div>;
    
    logContainer.appendChild(resultEl);
    
    // Scroll to bottom
    const activityLog = this.get('.activity-log');
    if (activityLog) {
      activityLog.scrollTop = activityLog.scrollHeight;
    }
  }

  // Legacy compatibility method
  displayEvaluationResult(code, result, success) {
    return this.displayToolResult('evaluate-code', { code }, result, success);
  }
  
  logActivity(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    
    if (!this.logs) return;
    this.logs.unshift({
      timestamp,
      type,
      message
    });
    
    // Limit log entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    this.updateActivityLog();
  }
  
  updateActivityLog() {
    const logContainer = this.get('#logContainer');
    if (!logContainer) return;
    
    // Clear container
    logContainer.innerHTML = '';
    
    if (this.logs.length === 0) {
      logContainer.innerHTML = '<div class="empty-log">No MCP activity yet. Waiting for connections...</div>';
      return;
    }
    
    this.logs.forEach(log => {
      const logEntry = <div class="log-entry">
        <div class="log-time">{log.timestamp}</div>
        <div class={`log-type ${log.type}`}>{log.type.toUpperCase()}</div>
        <div class="log-message" title={log.message}>{log.message}</div>
      </div>;
      
      logContainer.appendChild(logEntry);
    });
  }
  
  onReconnectButton() {
    if (this.ws) {
      this.ws.close();
    }
    this.connectToMcpServer();
  }
  
  onClearButton() {
    this.logs = [];
    this.updateActivityLog();
    
    // Also clear evaluation results
    const evalResults = this.shadowRoot.querySelectorAll('.eval-result');
    evalResults.forEach(el => el.remove());
    
    this.logActivity('info', 'Activity log cleared');
  }
  
  livelyPreMigrate() {
    if (this.ws) {
      this.ws.close();
    }
  }
  
  livelyMigrate(other) {
    this.sessionId = other.sessionId || generateUUID();
    this.logs = other.logs || [];
    this.maxLogs = other.maxLogs || 100;
    
    this.updateSessionInfo();
    this.updateActivityLog();
  }

  async livelyExample() {
    this.style.backgroundColor = "white";
    this.style.border = "2px solid #667eea";
    
    // Add some example log entries
    setTimeout(() => {
      this.logActivity('info', 'MCP Agent started');
      this.logActivity('request', 'Test code evaluation request');
      this.logActivity('response', 'Code executed successfully');
    }, 1000);
  }
}