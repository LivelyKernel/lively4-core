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
      
      // TODO define correct type of triple
      // At the moment this is not used and thus it is safe to set it to PlainLiteral.
      // If this ever becomes relevant, implement this distinction.
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
  
  static blankNodePattern() {
    return BLANK_NODE_PATTERN;
  }
}