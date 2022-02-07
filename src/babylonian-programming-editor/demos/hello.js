// import bar from "./hello2.js"

// function /*example:*/foo/*{"id":"a2f0_c7f4_d13d","name":{"mode":"input","value":"foo"},"color":"hsl(160, 30%, 70%)","values":{"a":{"mode":"input","value":"3"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(a) {
  
//   /*probe:*/return/*{}*/ bar(a) * 4
// }


async function /*example:*/hello/*{"id":"ae20_dfce_74ff","name":{"mode":"input","value":"h1"},"color":"hsl(310, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  
  await lively.sleep(0)
  var foo =  await Promise.resolve("World")
  
  
  return foo
}


async function /*example:*/bar/*{"id":"4dc1_3e4f_4f1f","name":{"mode":"input","value":""},"color":"hsl(190, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  
  
  var foo =  await hello()
  
  
  /*probe:*/return/*{}*/ foo
}




async function /*example:*/hello2/*{"id":"d8ae_9076_4f7e","name":{"mode":"input","value":"b"},"color":"hsl(200, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  
  var foo =  "World"
  
  /*probe:*/return/*{}*/ /*probe:*/foo/*{}*/
}

/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */