
'use strict';

export default class HTML {
  
  static registerButtons(parent) {
    // Just an experiment for having to write lesser code.... which ended up in having more code here ;-) #Jens
    Array.prototype.forEach.call(parent.shadowRoot.querySelectorAll("button"), node => {
      var name = node.id
      var funcName = name.replace(/^./, c => "on"+ c.toUpperCase())
      // console.log("register button " + name)
      $(node).click(() => {
        var func = parent[funcName]
        if (func) {
          func.call(parent)
        } else {
          alert("No callback: " +  funcName)
        }
      })
    })
  }
  
  static registerInputs(parent) {
    Array.prototype.forEach.call(parent.shadowRoot.querySelectorAll("input"), node => {
      var name = node.id
      var funcName = name.replace(/^./, function (c) {
            return "on" + c.toUpperCase() ;
          }) + "Changed";
      console.log("register input " + name)
        node.addEventListener("input", function(evt) {
          var value = node.value
          var func = parent[funcName];
          if (func) {
            func.call(parent, value);
          } else {
            // ignore it
            // alert("No callback: " + funcName);
          }
        });
      })
  }
  
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
          var m
          if (m = href.match(/javascript:visitPath\('webwerkstatt\/(.*)'\)/)) {
            path = "/Thesis/" + m[1]
          } else if (href.match(/([A-Za-z]+):\/\/.+/)) {
            // console.log("ignore "  + href);
            path = href;
          } else if (href.match(/^\//)) {
            path = href; // ABSOLTUE paths
          } else {
            path = dir + href // that leaves us RELATIVE paths
            
            if(!path.match(/((\.[A-Za-z]+)|(\/))$/)) {
              // no ending?
              // we could check, or assume md for the moment
              path += ".md"
              console.log("assume Markdown for "+ path)
            }
          }
          if (path) {
            
            
            // console.log("fix "  + href + " to " + path + "(dir " + dir + ")")
            $(node).click(() => { followPath(path); return false; });

            // ALTERNATIVE to navigate it inline, but the link will not be followed....
            // var link = lively4url + "/draft/start.html?load=" + path
            // node.setAttribute("href", link)
          } else {
            // console.log("ignore " + href)
          }
        } else if (node.getAttribute('src')) {
          // image tag
          let src = node.getAttribute('src'),
              // TODO: remove duplicate
              swAwareBasePath = '', //https://lively4/
              path;
          // TODO: remove duplucated logic
          if (src.match(/([A-Za-z]+):\/\/.+/)) {
            // ignore FULL URLS
            // console.log("ignore "  + src);
          } else if (src.match(/^\//)) {
            path = src; // ABSOLTUE paths
          } else {
            path = swAwareBasePath + dir + src // that leaves us RELATIVE paths
          }
          if (path) {
            node.setAttribute('src', path);
          } else {
            // console.log("ignore image " + href)
          }
        }
        this.fixLinks(node.childNodes, dir, followPath)
      }
    })
}

}
console.log("loaded html.js")
