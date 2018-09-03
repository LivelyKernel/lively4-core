export default class Person {
  constructor(name) {
    this.name = /*probe:*/name/*{}*/;
  }
  
  sayHi() {
    console.log(`Hi, I'm ${this.name}`);
  }
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */