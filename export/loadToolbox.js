var lively4Url =  'http://localhost:8081/lively4-core/';
loadTemplates('lively-toolbox', 'lively-window', 'lively-object-editor', 'lively-treeview', 'lively-editor', 'juicy-ace-editor', 'lively-tab-view', 'lively-key-value-map', 'lively-key-value-input');

function loadTemplates () {
  var identifiers = Array.from(arguments);
  loadJQuery();
  loadSystem();
  setTimeout(function () {
    loadBabel();
    loadLively4();
    loadAce();
    identifiers.forEach(function(templateIdentifier) {
      loadPart(templateIdentifier);
    })
    mountPart(identifiers[0]);
  }, 1000)
}

function loadAce() {
  var aceNode = document.createElement('script');
  aceNode.setAttribute('type', 'text/javascript');
  aceNode.setAttribute('src', lively4Url + 'src/external/ace.js');
  document.head.appendChild(aceNode);
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
  System.import(lively4Url + "src/client/script-manager.js").then(function(module) {
      window.scriptManager = module;
      log("scriptManager loaded");
  });
  System.import(lively4Url + "src/client/persistence.js").then(function(module) {
      window.persistence = module;
      log("persistence loaded");
  });
}

function loadPart (partIdentifierString) {
  $.get(lively4Url + 'templates/' + partIdentifierString + '.html', function(data) {
    data = data.replace('var baseUrl = "../src/client/morphic/";', 'var baseUrl = "' + lively4Url + 'src/client/morphic/";')
    data = data.replace('../src/client/css/morphic.css',  lively4Url + 'src/client/css/morphic.css');
    var parserNode = document.createElement('div');
    parserNode.innerHTML = data;
    document.head.appendChild(parserNode.getElementsByTagName('template')[0]);
    Array.from(parserNode.getElementsByTagName('script')).forEach(function(scriptNode) {
      if (scriptNode.getAttribute('src')) {
        document.head.appendChild(scriptNode);
      } else {
        var scriptString = scriptNode.innerHTML;
        scriptString = scriptString.replace(/document.currentScript.ownerDocument/g, 'document');
        scriptString = scriptString.replace(/\(document._currentScript \|\| document.currentScript\).ownerDocument/g, 'document');
        scriptString = scriptString.replace(/System.import\('..\//g, "System.import('" + lively4Url);
        scriptString = scriptString.replace(/System.import\("..\//g, 'System.import("' + lively4Url);
        eval(scriptString);
      }
    })
  });
}

function mountPart(partIdentifierString) {
  var aToolbox = document.createElement(partIdentifierString);
  document.body.insertBefore(aToolbox, document.body.firstChild);
  aToolbox.style.setProperty('position', 'fixed');
  aToolbox.style.setProperty('z-index', 10000);
}
