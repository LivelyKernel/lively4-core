// You can also define examples for class methods
class Person {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  sayHi() {
    console.log(`I'm ${this.name} and I like ${this.hobby}`);
  }
  
  reverseName() {
    this.name = this.name.split("").reverse().join("");
  }
}

/* Examples: {"annotations":{"probes":[{"location":[9,23,9,32]}],"sliders":[],"examples":[{"location":[8,2,8,7],"id":"b0b1_a952_7055","name":{"value":"","isConnection":false},"color":"hsl(340, 30%, 70%)","values":{},"instanceId":{"value":"0","isConnection":false},"prescript":"","postscript":""}],"replacements":[],"instances":[]},"context":{"prescript":"","postscript":""},"customInstances":[{"id":"68ae_6b05_bb36","name":"WHAT?","code":"return {name:\"asd\"}"}]} */