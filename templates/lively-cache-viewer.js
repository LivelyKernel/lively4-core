import Morph from 'src/components/widgets/lively-morph.js';

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
    
    lively.html.registerButtons(this);
    this._requestFromServiceWorker('cacheKeys');
  }
  
  /* 
   * Button listeners
   */
  
  async onLoadCacheValue() {
    var input = this.get("#files");
    this._requestFromServiceWorker('cacheValue', input.value);
  }
  
  /*
   * Methods to update UI
   */
  
  _showUpdatedCacheKeys(keys) {
    var fileList = this.get("#files");
    
    for (let key of keys) {
      let option = document.createElement('option');
      
      option.value = key;
      option.innerHTML = key;
      fileList.appendChild(option);
    }
  }
  
  _showUpdatedCacheValue(data) {
    var input = this.get("#content");
    var date = this.get("#date");
    const reader = new FileReader();

    reader.addEventListener('loadend', (e) => {
      const text = e.srcElement.result;
      input.innerText = text;
    });

    reader.readAsText(data.value.body);
    
    date.innerText = "Cached at: " +  new Date(data.timestamp);
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
        this._showUpdatedCacheKeys(data);
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
