import Morph from 'src/components/widgets/lively-morph.js';
import focalStorage from 'src/external/focalStorage.js';

export default class LivelyCacheViewer extends Morph {
  async initialize() {
    this.windowTitle = "Lively Cache Viewer";
    // Keep a copy so we don't have to ask the serviceworker for every search
    this._cacheKeys = [];
    this.registerButtons();
    
    // Register listener to receive data from serviceworker
    window.serviceWorkerMessageHandlers['cacheViewer'] = (event) => {
      const message = event.data;
      
      // Only handle notifications here
      if (message.type === 'dataResponse') {
        this._receiveFromServiceWorker(message.command, message.data);
      }
    };
    
    this._setUpSearch();
    this._setUpModeSelection();    
    this._sendToServiceWorker('cacheKeys');
  }
  
  /**
   * Set up search
   */
  _setUpSearch() {
    this._currentSearch = '';
    var searchInput = this.get("#search");
    $(searchInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      
      this._currentSearch = searchInput.value;
      this._showUpdatedCacheKeys();
    });
  }
  
  /**
   * Set up mode selection
   */
  _setUpModeSelection() {
    const instanceName = lively4url.split("/").pop();
    const cacheModeKey = `${instanceName}-cacheMode`;
    let modeSelect = this.get('#modeSelect');
    focalStorage.getItem(cacheModeKey).then(
      (cacheMode) => {
        if (cacheMode !== null) {
          modeSelect.selectedIndex = parseInt(cacheMode);
        }
      }
    )
    $(modeSelect).change((event) => {
      let value = event.target.selectedIndex;
      // Set cache mode
      // TODO: Mode should only be changed after successful loading
      focalStorage.setItem(cacheModeKey, value).then(() => {
        if (value == 3) {
          this._showLoadingScreen(true);
          this._sendToServiceWorker('preloadFull');
          
          // Message SWX
          this._sendToServiceWorker("updateCacheMode", value);
        }
      });
    })
  }
  
  /**
   * Reload cached keys
   */
  onRefreshButton() {
    this._showLoadingScreen(true);
    this._sendToServiceWorker('cacheKeys');
  }
  
  /**
   * Delete cache
   */
  onClearButton() {
    this._showLoadingScreen(true);
    this._sendToServiceWorker('clearCache');
  }
  
  /**
   * Methods to update UI
   */
  _showLoadingScreen(visible) {
    let overlay = this.get('#overlay');
    if (visible) {
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }
  }
  
  _showUpdatedCacheKeys() {
    let fileList = this.get("#list");
    fileList.innerHTML = '';
    
    // TODO: JSX would be much nicer here...
    let ul = document.createElement('ul');
    for (let key of this._cacheKeys) {
      // Only show keys matching search
      if (key.indexOf(this._currentSearch) === -1) continue;
      
      let li = document.createElement('li');
      li.innerText = key;
      li.addEventListener("click", () => {
        this._sendToServiceWorker('cacheValue', key);
      });
      ul.appendChild(li);
    }
    
    fileList.appendChild(ul);
  }
  
  _showUpdatedCacheValue(data) {
    let editor = this.get("#content");
    const reader = new FileReader();

    reader.addEventListener('loadend', (e) => {
      editor.value = e.srcElement.result;
    });

    reader.readAsText(data.value.body);
    
    this._showUpdatedStatus(new Date(data.timestamp));
  }
  
  _showUpdatedStatus(dateValue) {
    let statusField = this.get("#status");
    let statusText = `${this._cacheKeys.length} items in cache.`;
    
    if (dateValue) {
      statusText += ` Selected item cached at: ${dateValue}`;
    }
    
    statusField.innerText = statusText;
  }
  
  /**
   * Send a request for data to the serviceworker
   */
  _sendToServiceWorker(command, data) {
    navigator.serviceWorker.controller.postMessage({
      type: 'dataRequest',
      command: command,
      data: data
    });
  }
  
  /**
   * Receive some data from the serviceworker
   */
  _receiveFromServiceWorker(command, data) {
    switch (command) {
      case 'cacheKeys':
        this._cacheKeys = data;
        this._showUpdatedCacheKeys();
        this._showUpdatedStatus();
        this._showLoadingScreen(false);
        break;
      case 'cacheValue':
        this._showUpdatedCacheValue(data);
        break;
      case 'clearCacheDone':
        this._cacheKeys = [];
        this._showUpdatedCacheKeys();
        this._showUpdatedStatus();
        this._showLoadingScreen(false);
        break;
      case 'fullLoadingDone':
        this._requestFromServiceWorker('cacheKeys');
        break;
      default:
        console.warn(`Unknown data received from serviceWorker: ${command}: ${data}`)
    }
  }
}
