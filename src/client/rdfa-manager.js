import * as rdfa from '../external/RDFa.js';
import generateUuid from './uuid.js'

class RdfaTriple {
  constructor(subject, property, values) {
    this.subject = subject;
    this.property = property;
    this.values = values;
    this.isRoot = true;
  }
  
  setParent(parentTriple) {
    this.parent = parentTriple;
    this.isRoot = false;
  }
  
  toString() {
    let string = '';
    
    this.values.forEach((value) => {
      if (string.length > 0) {
        string += ', ';
      }
      
      if (Array.isArray(value)) {
        value.forEach((childValue) => {
          string += value.toString();
        })
      } else {
        string += value.toString();
      }
    })
    
    return string;
  }
  
  getReadableUrl() {
    return this.subject;
  }
}

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
    return firebase.database().ref("rdfaTriples/" + path).once('value')
      .then((data) => {
        let uuidMap = {};
        let triples = []
        let values = data.val();
        
        for (let id in values) {
          let val = values[id];
          let triple = new RdfaTriple(val.subject, val.property, val.values)
          triples.push(triple);
          if (this.isUuid(triple.subject)) {
            if (!uuidMap[triple.subject]) {
              uuidMap[triple.subject] = [];
            }
            uuidMap[triple.subject].push(triple);
          }
        }
        
        triples.forEach((triple) => {
          for (let i = 0; i < triple.values.length; i++) {
            let childTriples = uuidMap[triple.values[i]];
            if (childTriples) {
              triple.values[i] = childTriples;
              childTriples.forEach((childTriple) => {
                childTriple.setParent(triple);
              });
            }
          }
        });
        
        return triples;
      })
  }
  
  static isUuid(string) {
    return string.match(/\S{8}-\S{4}-4\S{3}-\S{4}-\S{12}/);
  }

  static addRdfaEventListener(mappings, callback) {
    let mappingArray = typeof mappings == 'string' ? [mappings] : mappings;
    mappingArray.forEach((mapping) => {
      this.listener.push({mapping: mapping, callback: callback})
    })
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
      for (let property in properties) {
        let values = properties[property];
        for (let i = 0; i < values.length; i++) {
          let value = values[i];
          if (this.isAnnonymousSubject(value)) {
            values[i] = this.subject2DataMapping[value];
          }
        }
      }
    })
    return projections;
  }

  static isAnnonymousSubject(string) {
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
  
  static getRDFaTriples() {
    let subject2uuid = {};
    let projections = document.data.rdfa.query();
    let triples = [];
    document.data.getSubjects().forEach((subject) => {
      let subjectIdentifier = subject;
      if (!subject2uuid[subject]) {
        if (this.isAnnonymousSubject(subject)) {
          subjectIdentifier = generateUuid();
        }
        subject2uuid[subject] = subjectIdentifier;
      }
    });
    projections.forEach((projection) => {
      let subject = projection.getSubject();
      let properties = projection._data_.properties;
      for (let property in properties) {
        let values = properties[property];
        let processedValues = values.map((value) => {
          return subject2uuid[value] || value
        });
        triples.push({
          subject: subject2uuid[subject],
          property: property,
          //TODO all values
          values: processedValues});
      }
    })
    return triples;
  }
  
  static storeRDFaTriplesToFirebase() {
    let path = "rdfaTriples/";
    let triples = this.getRDFaTriples();
    let updates = {};
    triples.forEach((triple) => {
      let fullPath = path + generateUuid();
      let key = firebase.database().ref(fullPath).push().key;
      updates[key] = triple;
      /*firebase.database().ref(fullPath).set(triple).then(() => {
        lively.notify("Saved RDFa data", fullPath);
      }).catch((reason) => {
        lively.notify("Failed to save RDFa data to " + fullPath, reason);
      });*/
    });
    firebase.database().ref(path).update(updates).then(() => {
      lively.notify("Updated RDFa data", path);
    }).catch((reason) => {
      lively.notify("Failed to update RDFa data to " + path, reason);
    });
  }
}

RdfaManager.listener = [];
RdfaManager.initializeFirebase();
