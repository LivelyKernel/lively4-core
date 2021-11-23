
// #TODO this does not work yet

async function /*example:*/simpleWait/*{"id":"dd1a_bbbc_9d7d","name":{"mode":"input","value":"wait"},"color":"hsl(300, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  var /*probe:*/a/*{}*/ = 3
  await lively.sleep(100)
  var b = a + 4
  var /*probe:*/msg/*{}*/ = "result " + b
  console.log(b)
  
}



async function /*example:*//*example:*/asyncIteration/*{"id":"61ae_f3c6_b32e","name":{"mode":"input","value":"by1"},"color":"hsl(350, 30%, 70%)","values":{"inc":{"mode":"input","value":"1"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"ce23_5029_999d","name":{"mode":"input","value":"by2"},"color":"hsl(120, 30%, 70%)","values":{"inc":{"mode":"input","value":"2"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(inc) {

  let n = 0
  for(let i=0; i < 10; i++) {
    /*probe:*/n/*{}*/ += inc
    await lively.sleep(10)
  }
  /*probe:*/return/*{}*/ n
}






/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */