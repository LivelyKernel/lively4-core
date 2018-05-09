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

/* Examples: {"probe":[{"loc":[9,23,9,32]},{"loc":[9,47,9,57]}],"replacement":[],"example":[{"loc":[2,6,2,12],"value":"new Person(\"Tom\", \"climbing\")"},{"loc":[8,2,8,7],"value":{}}]} */