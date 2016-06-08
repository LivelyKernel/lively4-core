'use strict';

/*
 * Kitchensink for all HTML manipulation utilities
 */

export default class HTML {
  
  static hello() {
    alert("Hello World?")
  }
  
  // 
  
  // #JENS #ContinueWork here #NotFinished... load/save for tim
  static getFilter(ea) {
    return !['SCRIPT', 'LIVELY-PREFERENCES', 'LIVELY-HALOS'].includes(ea.tagName)
  }
  
  static getHtmlContent(body) {
    return _.filter(body.childNodes, this.getFilter).map( (ea) => ea.outerHTML).join("\n")
  }
  
  static clearHtmlContent(body) {
    return _.filter(body.childNodes, this.getFilter).each( (ea) => body.removeChild(ea)).join("\n")
  }
  
  static setHtmlContent(body, html) {
    var nodes = $.parseHTML(html)
    _.each(nodes, (ea) => {
      body.appendChild(html)
    })
  }
  
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
  
  static enhanceMarkdown(source) {
    return source.replace(/([^\n#])#([A-Za-z09]+)/g,
      "$1[#$2](https://lively4/Thesis/notes/$2.html)") // #TODO this should be a plugin or somthing since it is user specific / context specific code
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
        if (href && node.classList.contains("play")) {
          var filename = href.replace(lively4url.replace(/[^\/]*$/,""),"")
          console.log("fix play link " + filename)
          node.onclick = () => {
            lively.notify("play " + filename)
            fetch(lively4url + "/_meta/play", {
              headers: new Headers({ 
                filepath: filename
              })
            }).then(r => r.text()).then(t => {
                console.log("play: " + t)
            })
            return false
          }
          return
        } 
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
            $(node).click(() => { 
              // if (path.match(/https:\/\/lively4\/notes/)) {
              //     if (window.confirm("follow path? " + path)) {
              //       followPath(path); return false;
              //     }
              //     return false
              // }
              followPath(path); return false; });

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
