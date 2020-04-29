// You can also define examples for class methods
export default class Person {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  sayHello() {
    var /*probe:*/msg/*{}*/ = `I'm ${this.name} and I like ${this.hobby}` 
    console.log(msg);
  }
  
  reverseName() {
    /*probe:*/this.name/*{}*/ = this.name.split("").reverse().join("");
  }
}


async function testPerson() {
  var name = await lively.prompt("name", "")
  
  var person = new Person(name, "cycling")
  person.sayHello()
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */