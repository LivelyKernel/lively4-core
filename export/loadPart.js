var scriptNode = document.getElementById('lively4-chrome-loader');
var extensionLocation = scriptNode && scriptNode.getAttribute('data-location');
var extensionComponent = scriptNode && scriptNode.getAttribute('data-component');

loadTemplate(
  extensionComponent || prompt('Which template(s) do you want to load?', 'lively-halos'),
  extensionLocation || prompt('Where does your server run?', 'http://localhost:8081/lively4-core/'));

function loadTemplate (partNamesString, url) {
  lively4Url = url;
  loadJQuery();
  setTimeout(function() {
    loadSystem();
    setTimeout(function () {
      loadBabel();
      loadLively4();
      loadAce();
      var partName = partNamesString.split(' ')[0];
      var requiredTemplates = [partName].concat(templateNamesFromString(partNamesString));
      loadPartsViaLinkTag(requiredTemplates);
      mountPart(partName);
    }, 1000)
  }, 1000)
}

function templateNamesFromString(templateNamesString) {
  // allows loading (not mounting) additional modules with "temlateName (requiredTemplate1, requiredTemplate2)"
  var templatesNamesMatches = templateNamesString.match(/\((.*)\)/);
  if (templatesNamesMatches && templatesNamesMatches.length > 0) {
    return [1].split(', ').map(function (templateNameString) {
      return templateNameString.trim();
    })
  } else {
    return [];
  }
}

function loadPartsViaLinkTag (partNames) {
  partNames.forEach(function (partName) {
    var linkTag = document.createElement('link');
    linkTag.setAttribute('rel', 'import');
    linkTag.setAttribute('href', lively4Url + 'templates/' + partName + '.html');
    document.head.appendChild(linkTag);
  })
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
  aceNode.setAttribute('src', lively4Url + 'src/external/ace/ace.js');
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
  System.import(lively4Url + "src/client/script-manager.js").then(function(module) {
      window.scriptManager = module;
      console.log("scriptManager loaded");
  });
  System.import(lively4Url + "src/client/persistence.js").then(function(module) {
      window.persistence = module;
      console.log("persistence loaded");
  });
}
