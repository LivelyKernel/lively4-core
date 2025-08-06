import Morph from 'src/components/widgets/lively-morph.js';
import SearchRoots from "src/client/search-roots.js";

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
  
  get currentDirectoryName() {
    return lively4url.match(/(.*)\/([^\/]+$)/)[2]
  }
  
  connectToFileWatcher() {
    const wsUrl = this.defaultServerURL.replace(/^https?/, 'ws') + '/_filewatch';
    this.updateStatus('Connecting...', 'orange');
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.updateStatus('Connected', 'green');
        lively.success('Connected to file watcher');
        
        // Always watch the current lively4 directory (main development environment)
        this.ws.send(JSON.stringify({
          type: 'watch',
          path: this.currentDirectoryName
        }));
        
        // Also watch all additional search roots
        const searchRoots = SearchRoots.getSearchRoots() || [];
        searchRoots.forEach(rootUrl => {
          // Extract directory name from URL for file watching
          // Handle trailing slashes and get the actual directory name
          const dirName = rootUrl.replace(/\/$/, '').split('/').pop();
          if (dirName && dirName !== this.currentDirectoryName) {
            this.ws.send(JSON.stringify({
              type: 'watch',
              path: dirName
            }));
          }
        });
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
      // Calculate the edit URL once
      const [firstDir, ...pathParts] = change.path.split('/');
      const relativePath = firstDir === this.currentDirectoryName 
        ? pathParts.join('/') // Same directory, just use the rest
        : `../${change.path}`; // Sister directory, use .. to go up
      const editUrl = lively.files.resolve(`edit://${relativePath}`);
      
      const item = <div class="change-item">
        <span class={`event-type ${change.eventType.toLowerCase()}`}>{change.eventType}</span>
        <a class="path clickable" 
           href={editUrl}
           title="Click to open file"
           click={(evt) => {
             evt.preventDefault();
             lively.openBrowser(editUrl);
           }}>
          {change.path}
        </a>
        <span class="time">{change.displayTime}</span>
      </div>;
      
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