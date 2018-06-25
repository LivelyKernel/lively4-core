// You can also define examples for class methods
export default class /*instance:*/Person/*{"id":"a487_232d_f5b6","name":{"mode":"input","value":"Timmy"},"values":{"name":{"mode":"input","value":"\"Tim\""},"hobby":{"mode":"input","value":"\"cycling\""}}}*/ {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  /*example:*/sayHello/*{"id":"3b9d_abf9_90f1","name":{"mode":"input","value":""},"color":"hsl(0, 30%, 70%)","values":{},"instanceId":{"mode":"select","value":"a487_232d_f5b6"},"prescript":"","postscript":""}*/() {
    console.log(`I'm ${/*probe:*/this.name/*{}*/} and I like ${this.hobby}`);
  }
  
  reverseName() {
    this.name = this.name.split("").reverse().join("");
  }
}
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */