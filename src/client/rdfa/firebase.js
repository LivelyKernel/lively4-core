import * as firebase from '../../external/firebase.js';

export default class Firebase {
  
  constructor(config) {
    this.initFirebase(config);
  }
  
  initFirebase(config) {
    if (firebase.apps.filter(app => {
      return app.options.apiKey == config.apiKey
        && app.options.authDomain == config.authDomain
        && app.options.databaseURL == config.databaseURL
        && app.options.storageBucket == config.storageBucket;
    }).length > 0 ) {
      return;
    }
    
    firebase.initializeApp(config);
  }
  
  database() {
    return firebase.database();
  }
}