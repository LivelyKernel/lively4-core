import * as rdfa from '../../external/RDFa.js';

export default class GreenTurtleFactory {
  
  static fromTriples(triples) {
    const turtleParser = GreenTurtle.implementation.processors['text/turtle'].createParser();
    const graph = turtleParser.context;

    triples.forEach(triple => {
      let subject = triple.subject;
      let type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
      let value = triple.value;
      
      //TODO define correct type of triple
      /*
      if (this.isUuid(subject)) {
        subject = "_:" + subject;
        type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";
      }*/
      
      const object = {type: type, value: value};
      turtleParser.addTriple(subject, triple.predicate, object);
    });

    return graph;
  }
  
  static isUuid(string) {
    return typeof string == 'string' && string.match(/\S{8}-\S{4}-4\S{3}-\S{4}-\S{12}/);
  }
}