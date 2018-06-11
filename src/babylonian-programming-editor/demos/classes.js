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
/* Examples: {"annotations":{"probes":[{"location":[9,23,9,32]}],"sliders":[],"examples":[{"location":[8,2,8,7],"id":"1c9f_5fb5_8820","name":{"mode":"input","value":""},"color":"hsl(180, 30%, 70%)","values":{},"instanceId":{"mode":"select","value":"c583_ac5d_3548"},"prescript":"","postscript":""}],"replacements":[],"instances":[{"location":[2,6,2,12],"id":"c583_ac5d_3548","name":{"mode":"input","value":"Someone."},"values":{"name":{"mode":"input","value":"\"Timmy\""},"hobby":{"mode":"input","value":"\"cycling\""}}}]},"context":{"prescript":"","postscript":""},"customInstances":[]} */