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
/* Examples: {"probes":[{"location":[9,23,9,32]},{"location":[13,4,13,13]}],"sliders":[],"examples":[],"replacements":[],"instances":[]} */