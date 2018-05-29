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
/* Examples: {"probes":[{"location":[9,23,9,32]},{"location":[13,4,13,13]}],"sliders":[],"examples":[{"location":[8,2,8,7],"id":"6a92-5014-a1b0","name":"Example","values":{},"instanceId":"af43-0b87-cb3e"},{"location":[12,2,12,13],"id":"16e9-adb9-644d","name":"Reverse","values":{},"instanceId":"6faf-4093-0cc9"}],"replacements":[],"instances":[{"location":[2,6,2,12],"id":"af43-0b87-cb3e","name":"Timmy","code":"new Person(\"Tim\", \"cycling\")"},{"location":[2,6,2,12],"id":"6faf-4093-0cc9","name":"John","code":"new Person(\"John\", \"walking\")"}]} */