var lively4Url =  'http://localhost:8081/';
loadTemplate('lively-toolbox');

function loadTemplate (templateIdentifier) {
  loadJQuery();
  loadSystem();
  setTimeout(function () {
    loadBabel();
    loadLively4();
    loadPart(templateIdentifier);
    mountPart(templateIdentifier);
  }, 1000)
}

function loadJQuery () {
  var jQueryNode = document.createElement('script');
  jQueryNode.setAttribute('type', 'text/javascript');
  jQueryNode.setAttribute('src', 'https://code.jquery.com/jquery-2.1.4.js');
  document.head.appendChild(jQueryNode);
}

function loadSystem () {
  var systemScriptNode = document.createElement('script');
  systemScriptNode.setAttribute('type', 'text/javascript');
  systemScriptNode.setAttribute('src', lively4Url + 'src/external/system.src.js');
  document.head.appendChild(systemScriptNode);
}

function loadBabel () {
  var babelLoaderNode = document.createElement('script');
  babelLoaderNode.setAttribute('type', 'text/javascript');
  babelLoaderNode.innerHTML = '' + '\n' +
    "System.paths['babel'] = '" + lively4Url + "src/external/babel-browser.js'" + '\n' +
    "System.config({" + '\n' +
      "transpiler: 'babel'," + '\n' +
      "babelOptions: { }," + '\n' +
      "map: {" + '\n' +
          "babel: '" + lively4Url + "src/external/babel-browser.js'" + '\n' +
      "}" + '\n' +
    "});"
  document.head.appendChild(babelLoaderNode);
  System.config({
    baseURL: lively4Url + 'draft/'
  });
}

function loadLively4 () {
  System.import(lively4Url + "src/client/load.js").then(function(){
    System.import("commandline.js")
    System.import(lively4Url + "src/client/debug-serviceworker.js")
  }).catch(function(err) { alert("load Lively4 failed")});
}

function loadPart (partIdentifierString) {
  $.get(lively4Url + 'templates/' + partIdentifierString + '.html', function(data) {
    data = data.replace('var baseUrl = "../src/client/morphic/";', 'var baseUrl = "' + lively4Url + 'src/client/morphic/";')
    data = data.replace('../src/client/css/morphic.css',  lively4Url + 'src/client/css/morphic.css');
    var parserNode = document.createElement('div');
    parserNode.innerHTML = data;
    var templateNode = parserNode.children[0];
    var scriptNode = parserNode.children[1];
    var scriptString = scriptNode.innerHTML;
    document.head.appendChild(templateNode);
    scriptString = scriptString.replace('document.currentScript.ownerDocument', 'document');
    scriptString = scriptString.replace("System.import('../", "System.import('" + lively4Url);
    eval(scriptString);
  });
}

function mountPart(partIdentifierString) {
  var aToolbox = document.createElement(partIdentifierString);
  document.body.insertBefore(aToolbox, document.body.firstChild);
  aToolbox.style.setProperty('position', 'fixed');
}
