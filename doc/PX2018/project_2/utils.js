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