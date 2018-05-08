export function openComponent(name, text) {
  let link = _getLink(text);
  link.addEventListener("click", () => {
    lively.openComponentInWindow(name).then(comp => {
      if (!comp) return;
      
      comp.livelyExample();
    });
  });
  
  return link;
}

function _getLink(text) {
  let link = document.createElement("a");
  link.innerHTML = text;
  link.style.cursor = "pointer";
  link.style.textDecoration = "underline";
  
  return link;
}

export function createNewFileButton(subdir, text, name, input) {
  let container = document.createElement("div");
  let button = document.createElement("button");
  button.innerHTML = text || "new";
  
  if (input) {
    let input = document.createElement("input");
    container.appendChild(input);
    button.addEventListener("click", () => { _createNewFile(subdir, name, input) });
  } else {
    button.addEventListener("click", () => { _createNewFile(subdir, name) });
  }
  
  container.appendChild(button);
  return container;
}
  
async function _createNewFile(subdir, name, input) {
  var path = lively4url + "/" + subdir;
  var dir = path.replace(/[^/]*$/,"");
  
  let dateStr = new Date().toISOString().split('T')[0];
  let inputDate = null;
  
  if (input) {
    inputDate = input.value;
  }
  
  let filename =  name + "-" + (inputDate || dateStr) + ".md";
  let url = dir + filename;

  lively.notify("create " + url);
  if (await lively.files.existFile(url)) {
    lively.notify("Could not create " + url + ", because it already exists!");
  } else {
    let src = '<script>\nimport { openBrowser, openComponent } from "doc/PX2018/project_2/utils.js"\n</script>\n';
    src += '<link rel="stylesheet" type="text/css" href="doc/PX2018/project_2/utils.css">\n\n# \n\n'; 
    
    await lively.files.saveFile(url, src);
  }
  lively.openBrowser(url);
}
