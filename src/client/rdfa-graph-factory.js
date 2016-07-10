export default class RdfaGraphFactory {
  static fromTriples(triples) {
    const subjectMapping = {};
    const predicates = [];
    triples.forEach(triple => {
      const subject = triple.subject;
      let subjectObject = subjectMapping[subject];
      if (!subjectObject) {
        subjectObject = {
          id: subject,
          predicates: []
        };
        subjectMapping[subject] = subjectObject;
      }

      const predicate = {
        property: triple.property,
        values: triple.values
      };
      subjectObject.predicates.push(predicate);
      predicates.push(predicate);
    });

    predicates.forEach(predicate => {
      const values = predicate.values;
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const subject = subjectMapping[value];
        if (subject) {
          values[i] = subject;
        }
      }
    });

    const subjectArray = [];
    for (let key in subjectMapping) {
      subjectArray.push(subjectMapping[key]);
    }
    
    const objectGraph = {subjects: subjectArray};
    
    return objectGraph;
  }
  
  static fromGreenTurtleProjections(projections) {
    const objectGraph = {subjects: []};
    const subjectMapping = {};
    
    projections.forEach((projection) => {
      const subject = {
        id: projection._data_.subject,
        predicates: []
      };
      objectGraph.subjects.push(subject);
      const properties = projection._data_.properties;
      for (let property in properties) {
        const predicate = {
          property: property,
          values: properties[property]
        };
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
  
  static isBlankNode(string) {
    if (string && typeof string == 'string') {
      const pattern = new RegExp("^_:(\\d)+$");
      return pattern.test(string);
    }
    return false;
  }
}