/**
 * A class to manage the status of the network connection
 * Events: statusChanged
 */

const EVENT_NAME = 'statusChanged';
const CHECK_INTERVAL = 5000;

export class ConnectionManager {
  constructor() {
    // Whether or not we are currently online
    this.isOnline = true;
    
    // Listeners to notify on StatusChange
    this._listeners = [];
    
    // Add a listener to receive forwarded 'offline' and 'online' events from the window
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
    
    // Repeatedly check if we are really online, since the browser's 'online' status is not reliable
    self.setInterval(this._checkOnline, CHECK_INTERVAL, this);
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
  }
  
  /**
   * Is called repeatedly to check whether we are still online
   * Calls _statusChanged if the network status changes
   * @param connectionManager A reference to the ConnectionManager,
   *                          since this function is called from setInterval
   *                          and therefore does not have access to 'this'
   */
  _checkOnline(connectionManager) {
    // Only check if we think we are online
    if(!connectionManager.isOnline) {
      return;
    }
    
    // Try to reach the server
    let request = new Request(self.location.origin, {
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