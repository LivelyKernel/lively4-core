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
        this.buildRdfaObjectGraph();
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
        listener.callback(this.resolveSubjects(projections));
      }
    })
  }

  static resolveSubjects(projections) {
    projections.forEach((projection) => {
      let properties = projection._data_.properties;
      for (property in properties) {
        let values = properties[property];
        for (let i = 0; i < values.length; i++) {
          let value = values[i];
          if (this.isSubject(value)) {
            values[i] = this.subject2DataMapping[value];
          }
        }
      }
    })
    return projections;
  }

  static isSubject(string) {
    if (string && typeof string == 'string') {
      var pattern = new RegExp("^_:(\\d)+$")
      return pattern.test(string);
    }
    return false;
  }

  static buildRdfaObjectGraph() {
    this.subject2DataMapping = {};
    let projections = document.data.rdfa.query();
    projections.forEach((projection) => {
      let properties = projection._data_.properties;
      this.subject2DataMapping[projection.getSubject()] = projection;
    });
    this.objectGraph = this.resolveSubjects(projections);
  }
}

RdfaManager.listener = [];
RdfaManager.initializeFirebase();
