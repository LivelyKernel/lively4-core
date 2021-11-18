export default class /*instance:*/Person/*{"id":"269e_c910_74d9","name":{"mode":"input","value":"Timmy"},"values":{"name":{"mode":"input","value":"\"Timmy\""},"hobby":{"mode":"input","value":"\"cycling\""}}}*/ {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  /*slider:*//*example:*/sayHello/*{}*//*{"id":"cad4_721d_fcfc","name":{"mode":"input","value":"Tim"},"color":"hsl(290, 30%, 70%)","values":{},"instanceId":{"mode":"select","value":"269e_c910_74d9"},"prescript":"","postscript":""}*/() {
    console.log(`I'm ${/*probe:*/this.name/*{}*/} and I like ${this.hobby}` );
  }
  
  reverseName() {
    /*probe:*/this.name/*{}*/ = this.name.split("").reverse().join("");
  }
}



function testPerson() {
  var name = /*replacement:*/prompt("Enter a name", "")/*{"id":"c529_7730_62dc","value":{"mode":"input","value":"\"David\""}}*/
  let person = new Person(name, "debugging")
  return person
}


function /*example:*/sayLotsOfHello/*{"id":"81d8_7656_4354","name":{"mode":"input","value":"speaker"},"color":"hsl(10, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  let /*probe:*/speaker/*{}*/ = testPerson()
  for (var i = 0; i < 10; i++) {
    speaker.sayHello()
  }
}


/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */