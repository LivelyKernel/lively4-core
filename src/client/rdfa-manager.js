import * as rdfa from '../external/RDFa.js';

export default class RdfaManager {
  
  static loadFirebaseConfig() {
    return {
      apiKey: "AIzaSyCdiOSF0DUialcbR86BoJAmdj_RQFWgUk8",
      authDomain: "webdev16-rdfa.firebaseapp.com",
      databaseURL: "https://webdev16-rdfa.firebaseio.com",
      storageBucket: "webdev16-rdfa.appspot.com",
    };
  }
  
  static buildJSONRdfaDataStructure(fromFirebase = false) {
    return new Promise((resolve, reject) => {
      if (fromFirebase) {
        this.readDataFromFirebase().then((jsonWrapper) => {
          resolve(JSON.parse(jsonWrapper.val()));
        })
      } else {
        resolve(JSON.parse(this.getRdfaAsJson()));
      }
    });
  }

  static reloadData() {
    GreenTurtle.attach(document);
  }

  static getRdfaAsJson() {
    var json = JSON.stringify(
      document.data.rdfa.query(),
      function(key, val) {
        if (key == 'owner' && typeof val == 'object') return;
        return val;
      }
    );
    return json;
  }
  
  static initializeFirebase() {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(this.loadFirebaseConfig());
    }
  }
  
  static storeDataToFirebase() {
    let path = document.title.replace(/([\.\$\#\[\]\/]|[^[:print:]])/g, "_");
    firebase.database().ref("rdfa/" + path).set(this.getRdfaAsJson());
  }
  
  static readDataFromFirebase(path) {
    return firebase.database().ref("rdfa/" + path).once('value') // returns a Promise
  }
}

RdfaManager.initializeFirebase();