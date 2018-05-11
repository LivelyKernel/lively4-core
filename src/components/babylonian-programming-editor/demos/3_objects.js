// You can also define examples for class methods
class Person {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  sayHi() {
    console.log(`I'm ${this.name} and I like ${this.hobby}`);
  }
}
/* Examples: {"probes":[{"location":[9,23,9,32]}],"sliders":[],"examples":[{"location":[8,2,8,7],"name":"Example","values":{}}],"replacements":[],"instances":[{"location":[2,6,2,12],"code":"new Person(\"Tim\", \"cycling\")"}]} */