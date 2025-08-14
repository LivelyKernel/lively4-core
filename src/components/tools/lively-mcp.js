import Morph from 'src/components/widgets/lively-morph.js';
import {  uuid as generateUUID } from 'utils';
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
    debugger
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
    const wsUrl = this.defaultServerURL.replace(/^https?/, 'ws') + '/_mcp-session';
    this.updateStatus('Connecting...', false);
    this.logActivity('info', 'Connecting to MCP server...');
    
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
        await this.handleCodeEvaluation(message);
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
        this.logActivity('info', `Unknown message type: ${message.type}`);
        break;
    }
  }
  
  async handleCodeEvaluation(message) {
    const { code, requestId } = message;
    this.logActivity('request', `Evaluating: ${code.substring(0, 50)}${code.length > 50 ? '...' : ''}`);
    
    let result;
    let success = true;
    
    try {
      // Use SystemJS for module-based evaluation when possible
      if (code.includes('import ') || code.includes('System.import')) {
        // For import statements, wrap in async function
        const wrappedCode = `
          (async () => {
            ${code}
          })()
        `;
        result = await eval(wrappedCode);
      } else {
        // Direct evaluation for simple expressions
        result = eval(code);
      }
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        result = await result;
      }
      
      // Convert result to string for transmission
      if (typeof result === 'object') {
        result = JSON.stringify(result, null, 2);
      } else if (result === undefined) {
        result = 'undefined';
      } else {
        result = String(result);
      }
      
      this.logActivity('response', `Success: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
      
    } catch (error) {
      success = false;
      result = `Error: ${error.message}`;
      this.logActivity('error', `Evaluation failed: ${error.message}`);
    }
    
    // Send response back to server
    const response = {
      type: 'evaluation-result',
      requestId,
      sessionId: this.sessionId,
      success,
      result,
      timestamp: new Date().toISOString()
    };
    
    this.ws.send(JSON.stringify(response));
    
    // Also display result in UI
    this.displayEvaluationResult(code, result, success);
  }
  
  displayEvaluationResult(code, result, success) {
    const logContainer = this.get('#logContainer');
    if (!logContainer) return;
    
    // Remove empty message if present
    const emptyLog = logContainer.querySelector('.empty-log');
    if (emptyLog) {
      emptyLog.remove();
    }
    
    const resultEl = <div class={`eval-result ${success ? 'success' : 'error'}`}>
      <div style="font-weight: bold; margin-bottom: 4px;">Code:</div>
      <div style="margin-bottom: 8px;">{code}</div>
      <div style="font-weight: bold; margin-bottom: 4px;">Result:</div>
      <div>{result}</div>
    </div>;
    
    logContainer.appendChild(resultEl);
    
    // Scroll to bottom
    const activityLog = this.get('.activity-log');
    if (activityLog) {
      activityLog.scrollTop = activityLog.scrollHeight;
    }
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