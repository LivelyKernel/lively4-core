import * as rdfa from '../external/RDFa.js';
import generateUuid from './uuid.js'
import rdfaGraphFactory from './rdfa-graph-factory.js'

//var rdfaListener = [];

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

  static objectGraph() {
    return this.objectGraph;
  }

  static loadFirebaseConfig() {
    return {
      apiKey: "AIzaSyCdiOSF0DUialcbR86BoJAmdj_RQFWgUk8",
      authDomain: "webdev16-rdfa.firebaseapp.com",
      databaseURL: "https://webdev16-rdfa.firebaseio.com",
      storageBucket: "webdev16-rdfa.appspot.com",
    };
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

  static initializeFirebase() {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(this.loadFirebaseConfig());
    }
  }

  static readDataFromFirebase(bucket) {
    return firebase.database().ref("rdfaTriples/" + bucket).once('value')
      .then((data) => {
        let triples = [];
        let values = data.val();
        
        for (let id in values) {
          let val = values[id];
          let triple = new RdfaTriple(val.subject, val.property, val.values)
          triples.push(triple);
        }
        
        return triples;
      })
  }

  static addRdfaEventListener(mappings, callback) {
    let mappingArray = Array.isArray(mappings) ? mappings : [mappings];
    mappingArray.forEach((mapping) => {
      this.rdfaListener.push({mapping: mapping, callback: callback})
    })
  }

  static notifyRdfaEventListener() {
    this.rdfaListener.forEach((listener) => {
      let projections = document.data.rdfa.query(listener.mapping);
      if (projections.length > 0) {
        listener.callback(rdfaGraphFactory.fromGreenTurtleProjections(projections));
      }
    })
  }

  static buildRdfaObjectGraph() {
    let projections = document.data.rdfa.query();
    this.objectGraph = rdfaGraphFactory.fromGreenTurtleProjections(projections);
  }
  
  static getRDFaTriples() {
    let subject2uuid = {};
    let projections = document.data.rdfa.query();
    let triples = [];
    document.data.getSubjects().forEach((subject) => {
      let subjectIdentifier = subject;
      if (!subject2uuid[subject]) {
        if (rdfaGraphFactory.isBlankNode(subject)) {
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
          values: processedValues});
      }
    })
    return triples;
  }
  
  static storeRDFaTriplesToFirebase(bucket) {
    let path = "rdfaTriples/" + bucket + "/";
    let triples = this.getRDFaTriples();
    let updates = {};
    triples.forEach((triple) => {
      let fullPath = path + generateUuid();
      let key = firebase.database().ref(path).push().key;
      updates[key] = triple;
    });
    firebase.database().ref(path).update(updates).then(() => {
      lively.notify("Updated RDFa data", path);
    }).catch((reason) => {
      lively.notify("Failed to update RDFa data to " + path, reason);
    });
  }
}
RdfaManager.rdfaListener = [];
RdfaManager.initializeFirebase();