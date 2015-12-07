var lively4url =  'http://localhost:8081/';

// load jQuery
var jQueryNode = document.createElement('script');
jQueryNode.setAttribute('type', 'text/javascript');
jQueryNode.setAttribute('src', 'https://code.jquery.com/jquery-2.1.4.js');
document.head.appendChild(jQueryNode);
// load System
var systemScriptNode = document.createElement('script');
systemScriptNode.setAttribute('type', 'text/javascript');
systemScriptNode.setAttribute('src', lively4url + 'src/external/system.src.js');
document.head.appendChild(systemScriptNode);
setTimeout(function () {
  // load babel
  var babelLoaderNode = document.createElement('script');
  babelLoaderNode.setAttribute('type', 'text/javascript');
  babelLoaderNode.innerHTML = '' + '\n' +
    "System.paths['babel'] = '" + lively4url + "src/external/babel-browser.js'" + '\n' +
    "System.config({" + '\n' +
      "transpiler: 'babel'," + '\n' +
      "babelOptions: { }," + '\n' +
      "map: {" + '\n' +
          "babel: '" + lively4url + "src/external/babel-browser.js'" + '\n' +
      "}" + '\n' +
    "});"
  document.head.appendChild(babelLoaderNode);
  System.config({
    baseURL: lively4url + 'draft/'
  });

  // load lively 4
  System.import(lively4url + "src/client/load.js").then(function(){
      System.import("commandline.js")
      System.import(lively4url + "src/client/debug-serviceworker.js")
  }).catch(function(err) { alert("load Lively4 failed")});

  // var morphic;
  // System.import(lively4url + "export/morphic/morphic.js").then(m => {
  //     morphic = m;
  //     morphic.initMorphicTools();
  // }).catch(function(err) {
  //     debugger; alert("load morphic failed");
  // });

  // System.import(lively4url + "src/client/morphic/toolbox.js").then(toolbox => {
  //     //document.body.appendChild(toolbox.createMorphicToolbox());
  // }).catch(function(err) {
  //     debugger; alert("load morphic/toolbox failed");
  // });

  // load lively toolbox
  var toolboxScriptNode = document.createElement('script');
  toolboxScriptNode.setAttribute('type', 'text/javascript');
  toolboxScriptNode.setAttribute('src', lively4url + 'export/lively-toolbox.js');
  document.head.appendChild(toolboxScriptNode);

  var aToolbox = document.createElement('lively-toolbox');
  document.body.insertBefore(aToolbox, document.body.firstChild);
  aToolbox.style.setProperty('position', 'fixed');

}, 1000)
