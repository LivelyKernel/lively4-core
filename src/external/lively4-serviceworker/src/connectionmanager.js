import * as msg from './messaging.js'

/**
 * A class to manage the status of the network connection
 * Events: statusChanged
 */

const EVENT_NAME = 'statusChanged';
const CHECK_BROWSER_INTERVAL = 1000;
const CHECK_NETWORK_INTERVAL = 5000;

export class ConnectionManager {
  constructor() {
    // Whether or not we are currently online
    this.isOnline = true;
    
    // Listeners to notify on StatusChange
    this._listeners = [];
    
    // Add a listener to receive forwarded 'offline' and 'online' events from the window
    // This is unreliable since events won't be forwarded when there is an error in the window
    // Or when the window is not fully loaded, e.g. We don't get notified or changes in network
    // state while lively is loading. So we also poll the status in case we are not notified
    self.addEventListener('message', (e) => { 
      let data = e.data;
      if(data.type && data.message && data.type === 'network') {
        let newIsOnline;
        if(data.message === 'online') {
          this._setIsOnline(true);
        } else if(data.message === 'offline') {
          this._setIsOnline(false);
        }
      }
    });
    
    // Repeatedly check if the browser thinks we are online
    self.setInterval(this._checkBrowserOnline, CHECK_BROWSER_INTERVAL, this);
    
    // Repeatedly check if we are really online, since the browser's 'online' status is not reliable
    self.setInterval(this._checkNetworkOnline, CHECK_NETWORK_INTERVAL, this);
  }
  
  /**
   * Updates the status and notifies about changes if needed
   */
  _setIsOnline(newIsOnline) {
    if(newIsOnline !== this.isOnline) {
      this.isOnline = newIsOnline;
      this._statusChanged();
    }
  }
  
  /**
   * Is called whenever the network status changes
   * Notifies all listeners
   */
  _statusChanged() {
    // Call all listeners
    if (this._listeners && this._listeners.length) {
      this._listeners.forEach((listener) => {
        listener({
          isOnline: this.isOnline
        }); 
      });
    }
    
    // Send message to browser window
    if (this.isOnline) {
      msg.broadcast('You are now online', 'info');
    } else {
      msg.broadcast('You are now offline', 'warning');
    }
  }
  
  /**
   * Is called repeatedly to check whether the browser says we are online
   * Calls _statusChanged if the network status changes
   * @param connectionManager A reference to the ConnectionManager,
   *                          since this function is called from setInterval
   *                          and therefore does not have access to 'this'
   */
  _checkBrowserOnline(connectionManager) {
    if (!self.navigator.onLine) {
      connectionManager._setIsOnline(false);
    }
  }
  
  /**
   * Is called repeatedly to check whether we are still online
   * Calls _statusChanged if the network status changes
   * @param connectionManager A reference to the ConnectionManager,
   *                          since this function is called from setInterval
   *                          and therefore does not have access to 'this'
   */
  _checkNetworkOnline(connectionManager) {
    const checkUrl = `${location.origin}/?checkOnline=${+ new Date()}`;
    
    // Try to reach the server
    let request = new Request(checkUrl, {
      method: 'HEAD',
    });
    
    fetch(request)
      .then(() => {
        // We are really online
        connectionManager._setIsOnline(true);
      })
      .catch(() => {
        // Request was unsuccessful, so we are most likely offline
        connectionManager._setIsOnline(false);
      });
  }
  
  addListener(label, callback) {
    if(label == EVENT_NAME) {
      this._listeners.push(callback);
    }
  }
}