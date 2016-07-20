export default class RdfaTriple {
  constructor(subject, predicate, value) {
    this.subject = subject;
    this.predicate = predicate;
    this.value = value;
  }
  
  toString() {
    return this.subject + " " + this.predicate + " " + this.value;
  }
}