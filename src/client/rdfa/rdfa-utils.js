import * as rdfa from '../../external/RDFa.js';
import generateUuid from '../uuid.js';
import rdfaGraphFactory from '../rdfa-graph-factory.js';
import turtleFactory from './rdfa-green-turtle-graph-factory.js';
import Firebase from './firebase.js';
import RdfaTriple from './RdfaTriple.js';

export default class RdfaUtils {

  static objectGraph() {
    return this.objectGraph;
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
    this.firebase = new Firebase({
      apiKey: "AIzaSyCdiOSF0DUialcbR86BoJAmdj_RQFWgUk8",
      authDomain: "webdev16-rdfa.firebaseapp.com",
      databaseURL: "https://webdev16-rdfa.firebaseio.com",
      storageBucket: "webdev16-rdfa.appspot.com",
    });
  }

  static readDataFromFirebase(bucket, asGraph = false) {
    return this.firebase.database().ref("rdfaTriples/" + bucket).once('value')
      .then((data) => {
        let triples = [];
        let values = data.val();
        
        for (let id in values) {
          let val = values[id];
          let triple = new RdfaTriple(val.subject, val.predicate, val.value)
          triples.push(triple);
        }
        
        return asGraph ? turtleFactory.fromTriples(triples) : triples;
      })
  }
  
  static getBucketListFromFirebase() {
    return this.firebase.database().ref("rdfaTriples").once('value')
    .then(data => {
      const buckets = [];
      data.forEach(keyObject => {
        buckets.push(keyObject.key);
      })
      
      return buckets;
    });
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
          subjectIdentifier = '_:' + generateUuid();
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
        processedValues.forEach(processedValue => {
          triples.push(new RdfaTriple(subject2uuid[subject], property, processedValue));
        });
      }
    });
    return triples;
  }
  
  static storeRDFaTriplesToFirebase(bucket, triples = this.getRDFaTriples()) {
    let path = "rdfaTriples/" + bucket + "/";
    let updates = {};
    triples.forEach((triple) => {
      let key = this.firebase.database().ref(path).push().key;
      updates[key] = triple;
    });
   return this.firebase.database().ref(path).update(updates).then(() => {
      lively.notify("Updated RDFa data", path);
    }).catch((reason) => {
      lively.notify("Failed to update RDFa data to " + path, reason);
    });
  }
}

RdfaUtils.rdfaListener = [];
RdfaUtils.initializeFirebase();