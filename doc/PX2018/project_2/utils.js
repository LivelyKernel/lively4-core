function openComponent(name, text) {
  let link = _getLink(text);
  link.addEventListener("click", () => {
    lively.openComponentInWindow(name).then(comp => {
      if (!comp) return;
      
      comp.livelyExample();
    });
  });
  
  return link;
}

function openBrowser(path, text) {
  let link = _getLink(text);
  link.addEventListener("click", () => lively.openBrowser(lively4url + "/" + path));
  
  return link;
}

function _getLink(text) {
  let link = document.createElement("a");
  link.innerHTML = text;
  link.style.cursor = "pointer";
  
  return link;
}

function insertNewNoticeButton(subdir, text) {
  let button = document.createElement("button");
  button.addEventListener("click", () => { _createNoticeFile(subdir) });
  button.innerHTML = text || "new";
  return button;
}
  
async function _createNoticeFile(subdir) {
  var path = lively4url + "/" + subdir;
  var dir = path.replace(/[^/]*$/,"");
  
  let dateStr = new Date().toISOString().split('T')[0];
  let filename =  "notices-" + dateStr + ".md";
  let url = dir  + "/" + filename;

  lively.notify("create " + url);
  if (await lively.files.existFile(url)) {
    lively.notify("Could not create " + url + ", because it already exists!");
  } else {
    let src = '<script>\nlively.loadJavaScriptThroughDOM("thulur-utils", lively4url + "/doc/PX2018/project_2/utils.js");\n</script>\n';
    src += '<link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/utils.css">\n\n# \n\n'; 
    
    await lively.files.saveFile(url, src);
  }
  lively.openBrowser(url);
}
