import * as rdfa from '../../external/RDFa.js';
import md5 from '../../external/md5.js';
import generateUuid from '../uuid.js';
import graphFactory from './rdfa-graph-factory.js';
import RdfaTriple from './RdfaTriple.js';

const FIREBASE_SAMPLE_CONF = {
  apiKey: "AIzaSyA2wPvJ-OaCMpd559n2Tz_oyhWlGMLxXdU",
  authDomain: "webdev16-rdfa-b6944.firebaseapp.com",
  databaseURL: "https://webdev16-rdfa-b6944.firebaseio.com",
  storageBucket: "webdev16-rdfa-b6944.appspot.com",
};

export default class RdfaApi {

  /**
   * Register a listener that is called whenever RDFa is loaded. E.g. when you 
   * open the RDFa viewer.
   */
  static addRdfaEventListener(mapping, template, callback) {
    const id = generateUuid();
    this.rdfaListener[id] = {mapping: mapping, template: template, callback: callback};
    return id;
  }
  
  static removeRdfaEventListener(id) {
    delete this.rdfaListener[id];
  }

  static notifyRdfaEventListener() {
    for (let key in this.rdfaListener) {
      const listener = this.rdfaListener[key];
      let projections = this.queryResolved(document.data, listener.mapping, listener.template);
      if (projections.length > 0) {
        listener.callback(projections);
      }
    }
  }
  
  /**
   * Reruns the GreenTurtle parser and subsequently calls RDFaEventListeners.
   * Return a promise that resolves when the data was loaded, passing the 
   * document.data.
   */
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

  /**
   * Loads RDFa triples from a firebase instance at the supplied path.
   * Return a promise that resolves with the DocumentData containing the data
   * from the firebase.
   * See https://www.w3.org/2010/02/rdfa/sources/rdfa-api/#document-data
   */
  static loadDataFrom(firebase, bucket, root = "rdfTriples") {
    return firebase.database().ref(root + "/" + bucket).once('value')
      .then((data) => {
        let triples = [];
        let values = data.val();

        for (let id in values) {
          let val = values[id];
          let triple = new RdfaTriple(val.subject, val.predicate, val.value);
          triples.push(triple);
        }

        let graph = graphFactory.fromTriples(triples);
        let documentData = GreenTurtle.implementation.createDocumentData("http://example.org");
        documentData.merge(graph.subjects, {
          prefixes: graph.prefixes,
          mergeBlankNodes: true
        });

        return documentData;
      });
  }
  
  /**
   * Removes all data from the firebase instance at the .
   */
  static removeDataFrom(firebase, bucket, root = "rdfTriples") {
    return firebase.database().ref(root + "/" + bucket).remove();
  }

  /**
   * Returns a promise that resolves to an array of available buckets in the 
   * firebase instance.
   */
  static getBucketListFrom(firebase, root = "rdfTriples") {
    return firebase.database().ref(root).once('value')
    .then(data => {
      const buckets = [];
      data.forEach(keyObject => {
        buckets.push(keyObject.key);
      });

      return buckets;
    });
  }

  /**
   * Returns a list of all triples on the current web site.
   * Blank nodes are replaced with uuids.
   */
  static getRDFaTriples() {
    let subject2uuid = {};
    let projections = document.data.rdfa.query();
    let triples = [];
    document.data.getSubjects().forEach((subject) => {
      let subjectIdentifier = subject;
      if (!subject2uuid[subject]) {
        if (graphFactory.isBlankNode(subject)) {
          subjectIdentifier = this.newBlankNodeId();
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
          return subject2uuid[value] || value;
        });
        processedValues.forEach(processedValue => {
          triples.push(new RdfaTriple(subject2uuid[subject], property, processedValue));
        });
      }
    });
    return triples;
  }
  
  /**
   * Returns a promise, that resolves with a boolean whether the triple could be saved.
   */
  static storeRdfTriplesTo(firebase, bucket, triples = this.getRDFaTriples(), root = "rdfTriples") {
    let path = root + "/" + bucket + "/";
    let updates = {};
    triples.forEach((triple) => {
      let key = this.generateKeyForTriple(triple);
      updates[key] = triple;
    });
   return firebase.database().ref(path).update(updates).then(() => {
      lively.notify("Updated RDFa data", path);
      return true;
    }).catch((reason) => {
      lively.notify("Failed to update RDFa data to " + path, reason);
      return false;
    });
  }
  
  /**
   * Returns a promise, that resolves with a boolean whether the triple could be saved.
   * 
   * This method deletes the old triple and saves the new one.
   */
  static updateRdfTriple(firebase, bucket, oldRdfaTriple, newRdfaTriple, root = "rdfTriples") {
    let path = root + "/" + bucket + "/";
    let oldKey = this.generateKeyForTriple(oldRdfaTriple);
    let newKey = this.generateKeyForTriple(newRdfaTriple);
    let updates = {};
    updates[oldKey] = null;
    updates[newKey] = newRdfaTriple;
    
    return firebase.database().ref(path).update(updates).then(() => {
      console.log("Updated RDFa triple", path, "old", oldRdfaTriple, "new", newRdfaTriple);
      return true;
    }).catch((reason) => {
      lively.notify("Failed to update RDFa data to " + path, reason);
      return false;
    });
  }
  
  static removeRdfTriple(firebase, bucket, rdfaTriple, root = "rdfTriples") {
    const key = this.generateKeyForTriple(rdfaTriple);
    return firebase.database().ref(root + "/" + bucket + "/" + key).remove();
  }
  
  static generateKeyForTriple(triple) {
    return md5(triple.subject + ">>>" + triple.predicate + ">>>" + triple.value)
  }


  /**
   * Resolves the query object to an object populated with the data from the 
   * data parameter. Blank nodes can be resolved by defining a hierarchical template.
   * 
   * See https://www.w3.org/TR/rdfa-api/#advanced-concepts
   * 
   * Simple Example:
   * queryResolved( 
   *   { 
   *     "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": "http://xmlns.com/foaf/0.1/Person"
   *   },{ 
   *     "name": "http://xmlns.com/foaf/0.1/name",
   *     "age": "http://xmlns.com/foaf/0.1/age"
   *   }
   * );
   * 
   * Complex Example: See /templates/classes/RdfaMovieDb.js:filterMovies
   * 
   * data DocumentData
   * query {key: value} A property-value-filter. The property must exist and 
   * have that value. Can be one or more selectors (key-value pairs).
   * hierarchicalTemplate {} A template to map RDFa data to a POJO hierarchy. See the examples.
   * 
   */
  static queryResolved(data, query, hierarchicalTemplate) {
    if (!data) throw new Error("data must not be undefined");

    const template = {};
    const subjectsToPostResolve = [];

    for (let key in hierarchicalTemplate) {
      const iri = hierarchicalTemplate[key]; // iri = Internationalized Resource Identifier
      if (Array.isArray(iri)) {
        if (iri.length != 2) throw 'IRI has to be a tuple';
        template[key] = iri[0];
        subjectsToPostResolve.push({'key': key, 'template': iri[1]});
      } else {
        template[key] = iri;
      }
    }
    const projections = (typeof query === 'object')
      ? data.rdfa.query(query, template)
      : [data.getProjection(query, template)]; // then query is a subjectId

    subjectsToPostResolve.forEach(object => {
      const key = object.key;
      const template = object.template;
      projections.forEach(projection => {
        let subjectIds = projection[key];
        if (!subjectIds) return;

        if (!Array.isArray(subjectIds)) {
          subjectIds = [subjectIds];
        }

        let resolvedProjections = [];

        subjectIds.forEach(subjectId => {
          const subProjections = this.queryResolved(data, subjectId, template);
          resolvedProjections = resolvedProjections.concat(subProjections);
        });

        projection[key] = (resolvedProjections.length == 1)
          ? resolvedProjections[0]
          : resolvedProjections;
      });
    });

    return projections;
  }

  static firebaseSampleConf() {
    return FIREBASE_SAMPLE_CONF;
  }

  static newBlankNodeId() {
    return "_:" + generateUuid();
  }
}

RdfaApi.rdfaListener = {};
