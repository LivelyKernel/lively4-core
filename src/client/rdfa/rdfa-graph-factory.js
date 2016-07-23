import * as rdfa from '../../external/RDFa.js';

const BLANK_NODE_PATTERN = /^_:.+/;
const UUID_PATTERN = /\S{8}-\S{4}-4\S{3}-\S{4}-\S{12}/;

export default class GraphFactory {
  
  static fromTriples(triples) {
    const turtleParser = GreenTurtle.implementation.processors['text/turtle'].createParser();
    const graph = turtleParser.context;

    triples.forEach(triple => {
      let subject = triple.subject;
      let type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
      let value = triple.value;
      
      //TODO define correct type of triple
      /*
      if (this.isSubject(value)) {
        type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";
      }*/

      const object = {type: type, value: value};
      turtleParser.addTriple(subject, triple.predicate, object);
    });

    return graph;
  }
  
  static isBlankNode(string) {
    if (string && typeof string == 'string') {
      return BLANK_NODE_PATTERN.test(string);
    }
    return false;
  }
  
  //TODO refactoring
  static fromGreenTurtleProjections(projections) {
    const objectGraph = {subjects: []};
    const subjectMapping = {};
    
    projections.forEach((projection) => {
      const subject = new RdfaSubject(projection._data_.subject);
      objectGraph.subjects.push(subject);
      const properties = projection._data_.properties;
      for (let property in properties) {
        const predicate = new RdfaPredicate(property, properties[property]);
        subject.predicates.push(predicate); 
      }
      
      subjectMapping[projection.getSubject()] = subject;
    });
    
    objectGraph.subjects.forEach((subject) => {
      subject.predicates.forEach((predicate) => {
        const values = predicate.values;
        for (let i = 0; i < values.length; i++) {
          let value = values[i];
          if (this.isBlankNode(value) && subjectMapping[value]) {
            values[i] = subjectMapping[value];
          }
        }
      });
    });
    
    return objectGraph;
  }
  
  static blankNodePattern() {
    return BLANK_NODE_PATTERN;
  }
}