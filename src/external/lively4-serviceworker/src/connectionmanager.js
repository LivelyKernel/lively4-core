/**
 * A class to manage the status of the network connection
 * Currently forwards system events, but should perform additional monitoring in the future
 * Events: statusChanged
 */

const EVENT_NAME = 'statusChanged';

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
          newIsOnline = true;
        } else if(data.message === 'offline') {
          newIsOnline = false;
        }
        
        //Update status
        if(typeof newIsOnline !== 'undefined' && newIsOnline !== this.isOnline) {
          this.isOnline = newIsOnline;
          this._statusChanged();
        }
      }
    });
  }
  
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
  
  addListener(label, callback) {
    if(label == EVENT_NAME) {
      this._listeners.push(callback);
    }
  }
}