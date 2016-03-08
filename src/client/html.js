
'use strict';

export default class HTML {

  static fixLinks(nodes, dir, followPath) {
    if (! followPath) {
      throw new Error("argument followPath missing");
    }
    if (! nodes) return;
    
    Array.prototype.forEach.call(nodes, node => {
      if (node.getAttribute) {
        var href = node.getAttribute("href")
        if (href) {
          // #TODO load inplace....
          var path;
          if (href.match(/([A-Za-z]+):\/\/.+/)) {
            // ignore FULL URLS
            console.log("ignore "  + href);
          } else if (href.match(/^\//)) {
            path = href; // ABSOLTUE paths
          } else {
            path = dir + href // that leaves us RELATIVE paths
          }
          if (path) {
            if(!path.match(/\.[a-z]+$/)) {
              
              // no ending?
              // we could check, or assume md for the moment
              path += ".md"
              console.log("assume Markdown for "+ path)
            }
            
            console.log("fix "  + href + " to " + path + "(dir " + dir + ")")
            $(node).click(() => { followPath(path); return false; });

            // ALTERNATIVE to navigate it inline, but the link will not be followed....
            // var link = lively4url + "/draft/start.html?load=" + path
            // node.setAttribute("href", link)
          } else {
            console.log("ignore " + href)
          }
        }
        this.fixLinks(node.childNodes, dir, followPath)
      }
    })
}

}
console.log("loaded html.js")
