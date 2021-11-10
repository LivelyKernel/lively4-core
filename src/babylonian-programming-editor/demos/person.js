export default class /*instance:*/Person/*{"id":"5a21_c16d_9e81","name":{"mode":"input","value":"Tim"},"values":{"name":{"mode":"input","value":"\"Timmy\""},"hobby":{"mode":"input","value":""}}}*/ {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  /*slider:*/sayHello/*{}*/() {
    console.log(`I'm ${this.name} and I like ${this.hobby}` );
  }
  
  reverseName() {
    this.name = this.name.split("").reverse().join("");
  }
}



function testPerson() {
  var name = /*replacement:*/prompt("Enter a name", "")/*{"id":"3967_7cb1_c84b","value":{"mode":"input","value":"\"David\""}}*/
  let person = new Person(name, "debugging")
  return person
}


function /*example:*/sayLotsOfHello/*{"id":"00c2_2c13_8a86","name":{"mode":"input","value":"speaker"},"color":"hsl(300, 30%, 70%)","values":{"n":{"mode":"input","value":"10"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(n) {
  let speaker = testPerson()
  for (var i = 0; i < n; i++) {
    speaker.sayHello()
  }
}


/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */