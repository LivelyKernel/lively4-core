export default class /*instance:*/Person/*{"id":"5a21_c16d_9e81","name":{"mode":"input","value":"Tim"},"values":{"name":{"mode":"input","value":"\"Timmy\""},"hobby":{"mode":"input","value":"\"hiking\""}}}*/ {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  /*example:*//*example:*/sayHello/*{"id":"b8e7_3471_5f14","name":{"mode":"input","value":"test"},"color":"hsl(30, 30%, 70%)","values":{"shout":{"mode":"input","value":""}},"instanceId":{"mode":"select","value":"5a21_c16d_9e81"},"prescript":"","postscript":""}*//*{"id":"bb41_bcac_7491","name":{"mode":"input","value":"test2"},"color":"hsl(200, 30%, 70%)","values":{"shout":{"mode":"input","value":"\"dadsf\""}},"instanceId":{"mode":"select","value":"5a21_c16d_9e81"},"prescript":"","postscript":""}*/(/*probe:*/shout/*{}*/) {
    
    var a = 4
    
    /*probe:*/a/*{}*/
    
    
    var msg = `I'm ${this.name} and I like ${this.hobby}` 
    if (shout) {
      msg = msg.toUpperCase()
    } 
    /*probe:*/msg/*{}*/
    console.log(/*probe:*/msg/*{}*/);
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