"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyChangeWatcher extends Morph {
  async initialize() {
    this.windowTitle = "File Change Watcher";
    this.registerButtons();
    
    this.changes = [];
    this.maxChanges = 100;
    
    this.connectToFileWatcher();
  }
  
  get defaultServerURL() {
    return lively4url.match(/(.*)\/([^\/]+$)/)[1]
  }
  
  connectToFileWatcher() {
    debugger
    const wsUrl = this.defaultServerURL.replace(/^https?/, 'ws') + '/_filewatch';
    this.updateStatus('Connecting...', 'orange');
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.updateStatus('Connected', 'green');
        lively.success('Connected to file watcher');
        
        // Auto-watch lively4-core directory
        this.ws.send(JSON.stringify({
          type: 'watch',
          path: 'lively4-core'
        }));
      };
      
      this.ws.onmessage = (event) => {
        const change = JSON.parse(event.data);
        if (change.type === 'file-change') {
          this.addFileChange(change);
        }
      };
      
      this.ws.onclose = () => {
        this.updateStatus('Disconnected', 'red');
        // Auto-reconnect after 2 seconds
        setTimeout(() => this.connectToFileWatcher(), 2000);
      };
      
      this.ws.onerror = (error) => {
        this.updateStatus('Error', 'red');
        lively.error('WebSocket error: ' + error.message);
      };
      
    } catch (error) {
      this.updateStatus('Failed', 'red');
      lively.error('Failed to connect: ' + error.message);
    }
  }
  
  updateStatus(text, color) {
    const status = this.get('#status');
    if (status) {
      status.textContent = text;
      status.style.color = color;
    }
  }
  
  addFileChange(change) {
    const timestamp = new Date(change.timestamp).toLocaleTimeString();
    const changeInfo = {
      ...change,
      displayTime: timestamp
    };
    
    this.changes.unshift(changeInfo);
    
    // Limit the number of stored changes
    if (this.changes.length > this.maxChanges) {
      this.changes = this.changes.slice(0, this.maxChanges);
    }
    
    this.updateChangesList();
    
    // Notify about the change
    const eventColor = {
      'CREATE': 'green',
      'DELETE': 'red', 
      'CHANGE': 'blue'
    }[change.eventType] || 'gray';
    
    lively.notify(`${change.eventType}: ${change.path}`, 1000, eventColor);
  }
  
  updateChangesList() {
    const list = this.get('#changesList');
    if (!list) return;
    
    list.innerHTML = '';
    
    this.changes.forEach(change => {
      const item = document.createElement('div');
      item.className = 'change-item';
      item.innerHTML = `
        <span class="event-type ${change.eventType.toLowerCase()}">${change.eventType}</span>
        <span class="path">${change.path}</span>
        <span class="time">${change.displayTime}</span>
      `;
      list.appendChild(item);
    });
  }
  
  onClearButton() {
    this.changes = [];
    this.updateChangesList();
  }
  
  onReconnectButton() {
    if (this.ws) {
      this.ws.close();
    }
    this.connectToFileWatcher();
  }

  livelyPreMigrate() {
    if (this.ws) {
      this.ws.close();
    }
  }
  
  livelyMigrate(other) {
    this.changes = other.changes || [];
    this.maxChanges = other.maxChanges || 100;
  }

  async livelyExample() {
    this.style.backgroundColor = "white";
    this.style.border = "1px solid #ccc";
  }
}