export default class /*instance:*//*instance:*/Person/*{"id":"c6f9_dcb4_d4e9","name":{"mode":"input","value":"Tim"},"values":{"name":{"mode":"input","value":"\"Tim\""},"hobby":{"mode":"input","value":"\"cycling\""}}}*//*{"id":"429f_26da_aae7","name":{"mode":"input","value":"David"},"values":{"name":{"mode":"input","value":"\"David\""},"hobby":{"mode":"input","value":"\"debugging\""}}}*/ {
  constructor(name, hobby) {
    this.name = name
    this.hobby = hobby;
  }
  
  sayHello() {
    console.log(`I'm ${this.name} and I like ${this.hobby}`);
  }
  
  /*example:*//*example:*/reverseName/*{"id":"623f_9b3f_31ab","name":{"mode":"input","value":""},"color":"hsl(280, 30%, 70%)","values":{},"instanceId":{"mode":"select","value":"c6f9_dcb4_d4e9"},"prescript":"","postscript":""}*//*{"id":"00d9_8bca_d639","name":{"mode":"input","value":""},"color":"hsl(90, 30%, 70%)","values":{},"instanceId":{"mode":"select","value":"429f_26da_aae7"},"prescript":"","postscript":""}*/() {
    /*probe:*/this.name/*{}*/ = this.name.split("").reverse().join("");
  }
  
  /*example:*//*example:*/compareNameTo/*{"id":"d7c0_8113_f508","name":{"mode":"input","value":"Less"},"color":"hsl(230, 30%, 70%)","values":{"otherPerson":{"mode":"select","value":"c6f9_dcb4_d4e9"}},"instanceId":{"mode":"select","value":"429f_26da_aae7"},"prescript":"","postscript":""}*//*{"id":"a7a3_dd09_5e53","name":{"mode":"input","value":"More"},"color":"hsl(150, 30%, 70%)","values":{"otherPerson":{"mode":"select","value":"429f_26da_aae7"}},"instanceId":{"mode":"select","value":"c6f9_dcb4_d4e9"},"prescript":"","postscript":""}*/(otherPerson) {
    /*probe:*/return/*{}*/ this.name.localeCompare(otherPerson.name);
  }
}
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */