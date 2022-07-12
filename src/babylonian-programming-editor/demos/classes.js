export default class /*instance:*//*instance:*/Person/*{"id":"269e_c910_74d9","name":{"mode":"input","value":"Timmy"},"values":{"n":{"mode":"input","value":"\"Timmy\""},"h":{"mode":"input","value":"\"cycling\""}}}*//*{"id":"2a41_0b55_4f1c","name":{"mode":"input","value":"Bob"},"values":{"n":{"mode":"input","value":""},"h":{"mode":"input","value":""}}}*/ {
  constructor(n, h) {
    this.name = n.toUpperCase()
    this.hobby = "Special " + h;
  }
  
  /*example:*//*example:*/sayHello/*{"id":"b701_31da_fdee","name":{"mode":"input","value":"a"},"color":"hsl(300, 30%, 70%)","values":{"msg":{"mode":"input","value":"\"Hi\""}},"instanceId":{"mode":"select","value":"269e_c910_74d9"},"prescript":"","postscript":""}*//*{"id":"186f_70e0_b7d1","name":{"mode":"input","value":"b"},"color":"hsl(50, 30%, 70%)","values":{"msg":{"mode":"input","value":""}},"instanceId":{"mode":"select","value":"269e_c910_74d9"},"prescript":"","postscript":""}*/(msg) {
    console.log(`I'm ${this.name} and I like ${/*probe:*/this.hobby/*{}*/}` );
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


function /*example:*/sayLotsOfHello/*{"id":"e5a0_9aed_5fd4","name":{"mode":"input","value":""},"color":"hsl(280, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  let speaker = testPerson()
  /*slider:*/for/*{}*/ (var /*probe:*/i/*{}*/ = 0; i < 10; i++) {
    speaker.sayHello()
  }
  
  // another function
  
  speaker.sayHello()
  
  
}


/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */