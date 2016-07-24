import * as rdfa from '../../external/RDFa.js';
import generateUuid from '../uuid.js';
import graphFactory from './rdfa-graph-factory.js';
import RdfaTriple from './RdfaTriple.js';

const FIREBASE_SAMPLE_CONF = {
  apiKey: "AIzaSyCdiOSF0DUialcbR86BoJAmdj_RQFWgUk8",
  authDomain: "webdev16-rdfa.firebaseapp.com",
  databaseURL: "https://webdev16-rdfa.firebaseio.com",
  storageBucket: "webdev16-rdfa.appspot.com",
};

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

  static addRdfaEventListener(mappings, callback) {
    let mappingArray = Array.isArray(mappings) ? mappings : [mappings];
    mappingArray.forEach((mapping) => {
      this.rdfaListener.push({mapping: mapping, callback: callback});
    });
  }

  static notifyRdfaEventListener() {
    this.rdfaListener.forEach((listener) => {
      let projections = document.data.rdfa.query(listener.mapping);
      if (projections.length > 0) {
        //TODO
        //listener.callback(graphFactory.fromGreenTurtleProjections(projections));
      }
    });
  }

  //TODO refactoring
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

  static storeRdfTriplesTo(firebase, bucket, triples = this.getRDFaTriples(), root = "rdfTriples") {
    let path = root + "/" + bucket + "/";
    let updates = {};
    triples.forEach((triple) => {
      let key = firebase.database().ref(path).push().key;
      updates[key] = triple;
    });
   return firebase.database().ref(path).update(updates).then(() => {
      lively.notify("Updated RDFa data", path);
    }).catch((reason) => {
      lively.notify("Failed to update RDFa data to " + path, reason);
    });
  }

  static queryResolved(data, query, hierachicalTemplate) {
    if (!data) throw new Error("data must not be undefined");

    const template = {};
    const subjectsToPostResolve = [];

    for (let key in hierachicalTemplate) {
      const iri = hierachicalTemplate[key];
      if (Array.isArray(iri)) {
        if (iri.length != 2) throw 'iri has to be a tuple';
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

RdfaApi.rdfaListener = [];
