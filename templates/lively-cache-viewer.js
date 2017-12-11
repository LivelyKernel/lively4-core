import Morph from 'src/components/widgets/lively-morph.js';
import focalStorage from 'src/external/focalStorage.js';

export default class LivelyCacheViewer extends Morph {
  async initialize() {
    this.windowTitle = "LivelyCacheViewer";
    
    // Register listener to receive data from serviceworker
    window.serviceWorkerMessageHandlers['cacheViewer'] = (event) => {
      const message = event.data;
      
      // Only handle notifications here
      if (message.type === 'dataResponse') {
        this._receiveFromServiceWorker(message.command, message.data);
      }
    };
    
    // Set up search
    this._currentSearch = '';
    var searchInput = this.get("#search");
    $(searchInput).keyup(event => {
      if (event.keyCode == 13) { // ENTER
        this._currentSearch = searchInput.value;
        this._showUpdatedCacheKeys();
      }
    });
    
    // Set up mode selectionn
    let modeSelect = this.get('#modeSelect');
    focalStorage.getItem("cacheMode").then(
      (cacheMode) => {
        if (cacheMode !== null) {
          modeSelect.selectedIndex = parseInt(cacheMode);
        }
      }
    )
    $(modeSelect).change((value) => {
      focalStorage.setItem("cacheMode", value.target.selectedIndex);
    })
    
    // Keep a copy so we don't have to ask the serviceworker for every search
    this._cacheKeys = [];
    
    lively.html.registerButtons(this);
    this._requestFromServiceWorker('cacheKeys');
  }
  
  /*
   * Component callbacks
   */
  onRefreshButton() {
    this._requestFromServiceWorker('cacheKeys');
  }
  
  /*
   * Methods to update UI
   */
  
  _showUpdatedCacheKeys() {
    var fileList = this.get("#list");
    fileList.innerHTML = '';
    
    // TODO: JSX would be much nicer here...
    let ul = document.createElement('ul');
    for (let key of this._cacheKeys) {
      // Only show keys matching search
      if (key.indexOf(this._currentSearch) === -1) continue;
      
      let li = document.createElement('li');
      li.innerText = key;
      li.addEventListener("click", () => {
        this._requestFromServiceWorker('cacheValue', key);
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
    var statusField = this.get("#status");
    
    let statusText = `${this._cacheKeys.length} items in cache.`;
    if (dateValue) {
      statusText += ` Selected item cached at: ${dateValue}`;
    }
    
    statusField.innerText = statusText;
  }
  
  /**
   * Send a request for data to the serviceworker
   */
  _requestFromServiceWorker(command, data) {
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
        break;
      case 'cacheValue':
        this._showUpdatedCacheValue(data);
        break;
      case 'cacheValue':
        //this._updateCacheKeys(data);
        console.log(data);
        break;
      default:
        console.warn(`Unknown data received from serviceWorker: ${command}: ${data}`)
    }
  }
}
