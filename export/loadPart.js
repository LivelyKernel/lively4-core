loadTemplate(
  prompt('Which template(s) do you want to load?', 'lively-halos'),
  prompt('Where does your server run?', 'http://localhost:8081/lively4-core/'));

function loadTemplate (partName, url) {
  lively4Url = url;
  loadJQuery();
  loadSystem();
  setTimeout(function () {
    loadBabel();
    loadLively4();
    loadAce();
    loadPartViaLinkTag(partName);
    mountPart(partName);
  }, 1000)
}

function loadPartViaLinkTag (partName) {
  var linkTag = document.createElement('link');
  linkTag.setAttribute('rel', 'import');
  linkTag.setAttribute('href', lively4Url + 'templates/' + partName + '.html');
  document.head.appendChild(linkTag);
}

function mountPart(partIdentifierString) {
  var aToolbox = document.createElement(partIdentifierString);
  document.body.insertBefore(aToolbox, document.body.firstChild);
  aToolbox.style.setProperty('position', 'fixed');
  aToolbox.style.setProperty('z-index', 10000);
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
  $.get(lively4Url + 'src/external/system.src.js', function(data) {
    data = data.replace(
      'var baseURIObj = new URL(baseURI);',
      'var baseURIObj = new URL("' + lively4Url + 'draft/");' );
    var systemScriptNode = document.createElement('script');
    systemScriptNode.setAttribute('type', 'text/javascript');
    systemScriptNode.innerHTML = data;
    document.head.appendChild(systemScriptNode);
  })
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
