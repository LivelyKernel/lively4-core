import Morph from 'src/components/widgets/lively-morph.js';
import SearchRoots from "src/client/search-roots.js";
import LivelyChanges from "src/client/changes.js";


/*MD 

# Lively Change Watcher Wuhu

Real-time file change monitoring component that automatically synchronizes open file editors when external changes are detected. Enables collaborative development workflows including AI agent integration and real-time collaboration between multiple users working in the same directory.

- Real-time WebSocket connection to lively4-server's `/_filewatch` endpoint
- Automatic detection of CREATE, CHANGE, and DELETE file events
- Forwards change events to matching `lively-container` editors
- Visual notifications and file change history
- Support for multiple directory watching via SearchRoots integration

**Dependencies:**
- WebSocket API for real-time server communication
- `lively-container.applyOutsideChanges()` for editor synchronization and deduplication

<div style="width:1000px"></div>

```mermaid
sequenceDiagram
    participant User as User/Agent
    participant Client as LivelyChangeWatcher
    participant Server as Lively4 Server
    participant FS as File System
    participant Container as LivelyContainer
    
    User->>Client: Open component
    Client->>Server: WebSocket connect /_filewatch
    Client->>Server: watch: "lively4-core"
    Server->>FS: Start watching directory
    
    User->>FS: Modify file.js
    FS->>Server: File change event
    Server->>Client: {type: "CHANGE", path: "file.js"}
    Client->>Container: applyOutsideChanges(url, false, sourceCode)
    Container->>Container: Check hash for duplicates
    Container->>Container: Update editor content
    Client->>User: Visual notification + UI update
```


MD*/

export default class LivelyChangeWatcher extends Morph {
  async initialize() {
    this.windowTitle = "File Change Watcher";
    this.registerButtons();
    
    if (!this.changes)
      this.changes = [];
    this.maxChanges = 100;
    this.shouldReconnect = true;
    
    
    // Set up apply mode dropdown
    this.applyModeDropdown = this.get('#applyMode');
    if (this.applyModeDropdown) {
      this.applyModeDropdown.addEventListener('change', () => {
        this.onApplyModeChanged();
      });
    }

    this.reloadJsCheckbox = this.get('#reloadJs');
    this.deepReloadCheckbox = this.get('#deepReload');
    
    this.updateChangesList()
  }
  
  
    /*MD 

The file watcher now properly handles connection lifecycle with the component's DOM lifecycle hooks. The auto-reconnection
   is prevented when the component is intentionally removed, but still works for unexpected disconnections.

  MD*/  

  
  connectedCallback() {
    this.shouldReconnect = true;
    this.connectToFileWatcher();
  }
  
  disconnectedCallback() {
    this.disconnectFromFileWatcher();
  }
  
  getApplyMode() {
    return this.applyModeDropdown ? this.applyModeDropdown.value : 'all';
  }

  isReloadJsEnabled() {
    return this.reloadJsCheckbox ? this.reloadJsCheckbox.checked : true;
  }

  isDeepReloadEnabled() {
    return this.deepReloadCheckbox ? this.deepReloadCheckbox.checked : true;
  }
  
  onApplyModeChanged() {
    const mode = this.getApplyMode();
    lively.notify(`File change mode: ${mode}`, 2000, 'blue');
  }
  
  async applyChangesWithoutContainer(change, expectedUrl, pathParts) {
    try {
      if (this.isReloadJsEnabled() && expectedUrl.match(/\.((js)|(ts))$/)) {
        const deep = this.isDeepReloadEnabled();
        const reloadResult = await lively.reloadModule(expectedUrl, true, true, deep);
        
        // Store reload info on change object
        change.reloadInfo = {
          reloaded: true,
          duration: reloadResult.duration,
          reloadedDependencies: reloadResult.reloadedDependencies,
          failedDependencies: reloadResult.failedDependencies || [],
          dependencyCount: reloadResult.dependencyCount,
          deep: reloadResult.deep,
          success: reloadResult.success,
          url: expectedUrl
        };
        
        const label = deep ? 'reloaded (deep)' : 'reloaded';
        lively.notify(`JS module ${label}: ${pathParts.join('/') || change.path}`, 2000, 'purple');
      } else {
        // Fallback: use LivelyChanges for CSS/HTML/other
        // cache: 'reload' bypasses the :9005 HTTP cache so we don't re-apply stale content
        const freshSourceCode = await fetch(expectedUrl, { cache: 'reload' }).then(r => r.text());
        await LivelyChanges.applyContainerChanges(null, expectedUrl, freshSourceCode, false);
        change.reloadInfo = {
          reloaded: false,
          applied: true,
          url: expectedUrl
        };
        lively.notify(`Applied changes without container: ${pathParts.join('/') || change.path}`, 2000, 'purple');
      }
    } catch (error) {
      console.warn(`Error applying changes without container for ${expectedUrl}:`, error);
      change.reloadInfo = {
        reloaded: false,
        error: error.message,
        url: expectedUrl
      };
      lively.notify(`Failed to apply changes: ${pathParts.join('/') || change.path}`, 3000, 'red');
    }
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
        // Ensure WebSocket is truly ready before sending
        if (this.ws.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket onopen fired but readyState is not OPEN:', this.ws.readyState);
          return;
        }
        
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
        // Auto-reconnect after 2 seconds only if not intentionally disconnected
        if (this.shouldReconnect) {
          setTimeout(() => this.connectToFileWatcher(), 2000);
        }
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

  disconnectFromFileWatcher() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.updateStatus('Disconnected', 'gray');
    }
  }
  
  
  updateStatus(text, color) {
    const status = this.get('#status');
    if (status) {
      status.textContent = text;
      status.style.color = color;
    }
  }
  
  async addFileChange(change) {
    // Filter out unwanted files from display
    if (change.path) {
      // Skip .transpiled files
      if (change.path.includes('.transpiled')) {
        return;
      }
      
      // Skip temporary files (random strings without extensions)
      const filename = change.path.split('/').pop();
      if (filename && filename.match(/^[a-zA-Z0-9]{6,}$/) && !filename.includes('.')) {
        return;
      }
    }
    
    // TODO: Special handling needed for src/client/contextmenu.js - it seems to have 
    // auto-reload issues and may need manual refresh of context menus after changes
    // (contextmenu.js appears to be cached or require special invalidation)
    
    // Enrich change with URL for use in UI and by LivelyChanges.since()
    const [firstDir, ...pathParts] = change.path.split('/');
    const url = firstDir === this.currentDirectoryName 
      ? `${lively4url}/${pathParts.join('/')}` 
      : `${this.defaultServerURL}/${change.path}`;
    
    const timestamp = new Date(change.timestamp).toLocaleTimeString();
    const changeInfo = {
      ...change,
      url: url,
      displayTime: timestamp
    };
    
    this.changes.unshift(changeInfo);
    
    // Limit the number of stored changes
    if (this.changes.length > this.maxChanges) {
      this.changes = this.changes.slice(0, this.maxChanges);
    }
    
    // Update lively-containers for CHANGE, CREATE, and DELETE events (this may set _noOpenContainer flag)
    if (change.eventType === 'CHANGE' || change.eventType === 'CREATE' || change.eventType === 'DELETE') {
      const applyMode = this.getApplyMode();
      if (applyMode !== 'off') {
        await this.updateLivelyContainers(changeInfo, applyMode); // Use changeInfo so the flag gets set on our stored object
      }
    }
    
    // Handle SYNC events for git status changes
    if (change.eventType === 'SYNC') {
      await this.updateGitStatusForFile(changeInfo);
    }
    
    // Update the list after container processing (so _noOpenContainer flag is set)
    this.updateChangesList();
    
    // Notify about the change
    const eventColor = {
      'CREATE': 'green',
      'DELETE': 'red', 
      'CHANGE': 'blue',
      'SYNC': 'purple'
    }[change.eventType] || 'gray';
    
    const message = change.eventType === 'SYNC' 
      ? `GIT SYNC: ${change.path}` 
      : `${change.eventType}: ${change.path}`;
    
    lively.notify(message, 1000, eventColor);
  }
  
  async updateLivelyContainers(change, applyMode = 'all') {
    // Find all lively-containers in the world
    const containers = document.querySelectorAll('lively-container');
    
    // Build the expected file URL from the change path
    const [firstDir, ...pathParts] = change.path.split('/');
    const expectedUrl = firstDir === this.currentDirectoryName 
      ? `${lively4url}/${pathParts.join('/')}`  // Same directory
      : `${this.defaultServerURL}/${change.path}`; // Sister directory
    
    let updatedCount = 0;
    let matchingContainers = [];
    
    // Find matching containers
    containers.forEach(container => {
      if (container.getBaseURL() === expectedUrl) {
        matchingContainers.push(container);
      }
    });

    if (matchingContainers.length === 0) {
      // No open containers 
      this.markChangeAsUnopened(change);
      
      // If mode is 'all', apply changes even without open containers.
      // CREATE is included because atomic/external saves (write-temp + rename, as done by
      // the Edit tool and many editors on Windows) surface as CREATE rather than CHANGE.
      if (applyMode === 'all' && (change.eventType === 'CHANGE' || change.eventType === 'CREATE')) {
        await this.applyChangesWithoutContainer(change, expectedUrl, pathParts);
      }
      
      return;
    }
    
    // Atomic/external saves often surface as CREATE (write-temp + rename) rather than
    // CHANGE. For a file that already has an open container this is a re-save, not a new
    // file, so clear any deleted-state and then fall through to the shared apply loop
    // below (no early return) so live instances actually get migrated.
    if (change.eventType === 'CREATE') {
      matchingContainers.forEach(container => {
        // Clear deleted state if file gets recreated
        if (this.getContainerFileDeleted(container)) {
          this.clearContainerDeletedState(container);
          lively.notify(`File restored: ${pathParts.join('/') || change.path}`, 2000, 'orange');
        }
      });
      // no return: continue to the reactive apply loop below
    }
    
    // For DELETE events, warn dramatically about deleted files still being open
    if (change.eventType === 'DELETE') {
      matchingContainers.forEach(container => {
        // Mark container as having deleted file
        this.markContainerAsDeleted(container);        
      });
      return;
    }
    
    // Process each matching container for CHANGE events
    for (let container of matchingContainers) {
      // Clear deleted state if file gets modified (it must exist now)
      if (this.getContainerFileDeleted(container)) {
        this.clearContainerDeletedState(container);
        lively.notify(`File restored: ${pathParts.join('/') || change.path}`, 2000, 'orange');
      }
      
      // Highlight the container for debugging
      // lively.showElement(container);
      
      // Check if container has unsaved changes
      if (container.unsavedChanges && container.unsavedChanges()) {
        // Warn user about unsaved changes - don't update
        lively.warn(`Container has unsaved changes: ${pathParts.join('/') || change.path}`, 3000);
        this.highlightContainerWithMessage(container, 'HAS UNSAVED CHANGES', 'orange', 3000);
      } else {
        try {
          // Wait for file to load, then apply reactive updates (not forced)
          await container.reloadContent(); // Reload content preserving current mode
          
          // Fetch fresh source code from server for external updates
          // cache: 'reload' bypasses the :9005 HTTP cache so we don't re-apply stale content
          const freshSourceCode = await fetch(expectedUrl, { cache: 'reload' }).then(r => r.text());
          await container.applyOutsideChanges(expectedUrl, false, freshSourceCode); // Reactive update with fresh source
          updatedCount++;
          
          // Track container update (not a module reload)
          change.reloadInfo = {
            reloaded: false,
            containerUpdated: true,
            containerCount: matchingContainers.length,
            url: expectedUrl
          };
          
          lively.notify(`Reactively updated: ${pathParts.join('/') || change.path}`, 2000, 'blue');
          this.highlightContainerWithMessage(container, 'UPDATED SUCCESSFULLY', 'green', 2000);
        } catch (error) {
          console.warn(`Error applying reactive updates to ${expectedUrl}:`, error);
          change.reloadInfo = {
            reloaded: false,
            containerUpdated: false,
            error: error.message,
            url: expectedUrl
          };
          lively.error(`Failed to update container: ${error.message}`);
          this.highlightContainerWithMessage(container, `UPDATE FAILED: ${error.message}`, 'red', 5000);
        }
      }
    }
    
    if (updatedCount > 0) {
      lively.success(`Applied reactive updates to ${updatedCount} container(s) for ${change.path}`);
    }
  }
  
  async updateGitStatusForFile(change) {
    // Find all lively-code-mirror components that might be editing this file
    const codeMirrors = lively.findAllElements(ea => ea.localName == "lively-code-mirror", true)
    
    // Build the expected file URL from the change path
    const [firstDir, ...pathParts] = change.path.split('/');
    const expectedUrl = firstDir === this.currentDirectoryName 
      ? `${lively4url}/${pathParts.join('/')}`  // Same directory
      : `${this.defaultServerURL}/${change.path}`; // Sister directory
    
    let updatedCount = 0;
    
    // Check each CodeMirror component
    for (const codeMirror of codeMirrors) {
      try {
        // Find the parent lively-editor to get the URL
        const livelyEditor = lively.query(codeMirror, "lively-editor");
        if (!livelyEditor) continue;
        
        const editorPath = livelyEditor.getURL().toString();
        if (editorPath === expectedUrl) {
          // This editor is showing the synced file - invalidate cache and refresh git status
          if (livelyEditor.invalidateFileContentCache) {
            livelyEditor.invalidateFileContentCache();
          }
          if (codeMirror.updateGitStatus) {
            await codeMirror.updateGitStatus();
            updatedCount++;
          }
        }
      } catch (error) {
        console.warn('Error updating git status for CodeMirror:', error);
      }
    }
    
    if (updatedCount > 0) {
      lively.notify(`Updated git status in ${updatedCount} editor(s): ${pathParts.join('/') || change.path}`, 2000, 'purple');
    } else {
      // Mark as no open editor for git status
      change._noOpenEditor = true;
      lively.notify(`Git synced (no open editor): ${pathParts.join('/') || change.path}`, 2000, 'gray');
    }
  }
  
  markChangeAsUnopened(change) {
    // Mark this change in the UI as having no open container
    // This will be handled in updateChangesList by checking for this flag
    change._noOpenContainer = true;
    lively.notify(`File changed (no open container): ${change.path}`, 2000, 'gray');
  }
  
  markContainerAsDeleted(container) {
    container.classList.add('file-deleted');
  }
  
  clearContainerDeletedState(container) {
    container.classList.remove('file-deleted');
  }
  
  getContainerFileDeleted(container) {
    return container.classList.contains('file-deleted');
  }
  
  highlightContainerWithMessage(container, message, color, timeout = 3000) {
    const highlight = lively.showElement(container, timeout);
    if (highlight) {
      const colorMap = {
        'orange': { border: 'orange', bg: 'rgba(255,165,0,0.8)' },
        'green': { border: 'green', bg: 'rgba(0,255,0,0.8)' },
        'red': { border: 'red', bg: 'rgba(255,0,0,0.8)' },
        'blue': { border: 'blue', bg: 'rgba(0,0,255,0.8)' }
      };
      
      const colors = colorMap[color] || colorMap['red'];
      highlight.style.border = `2px solid ${colors.border}`;
      highlight.innerHTML = `<pre data-is-meta='true' style='position: relative; top: -8px; width: 200px; background: ${colors.bg}; color: white; font-size: 8pt; padding: 2px;'>${message}</pre>`;
    }
    return highlight;
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
      
      // Build reload info display
      let reloadInfo = '';
      if (change.reloadInfo) {
        if (change.reloadInfo.reloaded) {
          const duration = change.reloadInfo.duration;
          const depCount = change.reloadInfo.dependencyCount || 0;
          const failed = change.reloadInfo.failedDependencies?.length || 0;
          const depText = failed > 0 
            ? `${depCount} deps, ${failed} failed` 
            : `${depCount} deps`;
          reloadInfo = `⟳ ${duration}ms (${depText})`;
        } else if (change.reloadInfo.containerUpdated) {
          reloadInfo = '📝 container updated';
        } else if (change.reloadInfo.applied) {
          reloadInfo = '✓ applied';
        } else if (change.reloadInfo.error) {
          reloadInfo = `✗ ${change.reloadInfo.error}`;
        }
      }
      
      const item = <div class={`change-item ${change._noOpenContainer ? 'no-container' : ''} ${change._noOpenEditor ? 'no-editor' : ''}`}>
        <span class={`event-type ${change.eventType.toLowerCase()}`}>{change.eventType}</span>
        <a class="path clickable" 
           title="Click to open file"
           click={(evt) => {
              evt.preventDefault();
              lively.openBrowser(change.url);
           }}>
          {change.path}
        </a>
        {reloadInfo && <span class="reload-info">{reloadInfo}</span>}
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
    if (this.reloadJsCheckbox && other.reloadJsCheckbox) {
      this.reloadJsCheckbox.checked = other.reloadJsCheckbox.checked;
    }
    if (this.deepReloadCheckbox && other.deepReloadCheckbox) {
      this.deepReloadCheckbox.checked = other.deepReloadCheckbox.checked;
    }
  }

  async livelyExample() {
    this.style.backgroundColor = "white";
    this.style.border = "1px solid #ccc";
  }
}