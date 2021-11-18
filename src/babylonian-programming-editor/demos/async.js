
// #TODO this does not work yet

async function /*example:*/simpleWait/*{"id":"dd1a_bbbc_9d7d","name":{"mode":"input","value":"wait"},"color":"hsl(300, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  var /*probe:*/a/*{}*/ = 3
  await lively.sleep(100)
  
  var b = a + 4
  var /*probe:*/msg/*{}*/ = "result " + b
  console.log(b)
  
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */