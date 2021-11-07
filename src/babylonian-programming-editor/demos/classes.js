// You can also define examples for class methods
export default class /*instance:*/Person/*{"id":"269e_c910_74d9","name":{"mode":"input","value":"Joe"},"values":{"name":{"mode":"input","value":"\"Joe\""},"hobby":{"mode":"input","value":"\"painting\""}}}*/ {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  /*example:*/sayHello/*{"id":"cad4_721d_fcfc","name":{"mode":"input","value":"hello joe"},"color":"hsl(290, 30%, 70%)","values":{},"instanceId":{"mode":"select","value":"269e_c910_74d9"},"prescript":"","postscript":""}*/() {
    var msg = `I'm ${/*probe:*/this/*{}*/.name} and I like ${this.hobby}` 
    console.log(/*probe:*/msg/*{}*/);
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