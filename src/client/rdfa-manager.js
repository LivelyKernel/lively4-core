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
        }).catch((reason) => {
          reject(reason);
        });
      } else {
        resolve(JSON.parse(this.getRdfaAsJson()));
      }
    });
  }

  static reloadData() {
    return new Promise((resolve, reject) => {
      let listenerFunc = (() => {
        lively.notify("RDFa loaded");
        document.removeEventListener("rdfa.loaded", listenerFunc);
        this.notifyRdfaEventListener();
        resolve();
      });
      document.addEventListener("rdfa.loaded", listenerFunc, false);
      GreenTurtle.attach(document);
    });
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
    let fullPath = "rdfa/" + path;
    firebase.database().ref(fullPath).set(this.getRdfaAsJson()).then(() => {
      lively.notify("Saved RDFa data", fullPath);
    }).catch((reason) => {
      lively.notify("Failed to save RDFa data to " + fullPath, reason);
    });
  }

  static readDataFromFirebase(path) {
    return firebase.database().ref("rdfa/" + path).once('value') // returns a Promise
  }

  //TODO
  /*
  lively.rdfa.addRdfaEventListener({ "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : "http://schema.org/GeoCoordinates" }, (projs) => {lively.notify("RDFa Geo data detected", projs)})
   */
  static addRdfaEventListener(mapping, callback) {
    this.listener.push({mapping: mapping, callback: callback})
  }

  static notifyRdfaEventListener() {
    this.listener.forEach((listener) => {
      let projections = document.data.rdfa.query(listener.mapping);
      if (projections.length > 0) {
        //TODO also provide whole rdfa data structure or object structure
        listener.callback(projections);
      }
    })
  }
}

RdfaManager.listener = [];
RdfaManager.initializeFirebase();
