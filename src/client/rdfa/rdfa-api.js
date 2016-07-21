import * as rdfa from '../../external/RDFa.js';
import generateUuid from '../uuid.js';
import graphFactory from './rdfa-graph-factory.js';
import Firebase from './firebase.js';
import RdfaTriple from './RdfaTriple.js';

export default class RdfaApi {

  static reloadData() {
    return new Promise((resolve, reject) => {
      let listenerFunc = (() => {
        lively.notify("RDFa loaded");
        document.removeEventListener("rdfa.loaded", listenerFunc);
        this.notifyRdfaEventListener();
        resolve(document.data);
      });
      document.addEventListener("rdfa.loaded", listenerFunc, false);
      //GreenTurtle.implementation.processors["microdata"].enabled = true;
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

  static readDataFromFirebase(bucket) {
    return this.firebase.database().ref("rdfaTriples/" + bucket).once('value')
      .then((data) => {
        let triples = [];
        let values = data.val();
        
        for (let id in values) {
          let val = values[id];
          let triple = new RdfaTriple(val.subject, val.predicate, val.value)
          triples.push(triple);
        }
        
        let graph = graphFactory.fromTriples(triples);
        let documentData = GreenTurtle.implementation.createDocumentData("http://example.org");
        documentData.merge(graph.subjects, {
          prefixes: graph.prefixes,
          mergeBlankNodes: true
        });

        return documentData;
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
        //TODO
        //listener.callback(graphFactory.fromGreenTurtleProjections(projections));
      }
    })
  }
  
  static getRDFaTriples() {
    let subject2uuid = {};
    let projections = document.data.rdfa.query();
    let triples = [];
    document.data.getSubjects().forEach((subject) => {
      let subjectIdentifier = subject;
      if (!subject2uuid[subject]) {
        if (graphFactory.isBlankNode(subject)) {
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

RdfaApi.rdfaListener = [];
RdfaApi.initializeFirebase();