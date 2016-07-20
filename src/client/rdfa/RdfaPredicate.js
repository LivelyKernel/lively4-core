export default class RdfaPredicate {
  constructor(property, values = []) {
    this.property = property;
    this.values = values;
  }
  
  value() {
    return this.values[0];
  }
}