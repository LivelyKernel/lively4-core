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
/* Examples: {"probes":[{"location":[9,23,9,32]}],"sliders":[],"examples":[{"location":[8,2,8,7],"id":"b9c3-4326-8de2","name":{"value":"ASDF","isConnection":false},"values":{},"instanceId":{"value":"813f-340e-a842","isConnection":false}}],"replacements":[],"instances":[{"location":[2,6,2,12],"id":"813f-340e-a842","name":{"value":"Timmy","isConnection":false},"values":{"name":{"value":"\"Timmy\"","isConnection":false},"hobby":{"value":"\"cycling\"","isConnection":false}}}]} */