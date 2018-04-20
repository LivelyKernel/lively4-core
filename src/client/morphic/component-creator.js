import * as componentLoader from "./component-loader.js";
import preferences from '../preferences.js';
import moment from "src/external/moment.js";
import Strings from "src/client/strings.js"

var htmlBeautify;
System.import(lively4url + "/src/external/beautify-html.js").then(function(obj){
    htmlBeautify = obj.html_beautify;
});

export function handle(el) {
  // collect information about the component
  var info = {};
  info["name"] = window.prompt("unique name (may contain spaces):");
  if (!info["name"]) {
    return;
  }

  // create html-tag by replacing spaces with '-' and lowercasing
  info["html-tag"] = "lively-" + info["name"].replace(/\s/g, "-").toLowerCase();
  info["description"] = window.prompt("Description:") || "";
  info["author"] = window.prompt("Author:") || "";
  var now = new Date();
  // note that getMonth() returns value [0..11]
  info["date-changed"] = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();

  var categories = window.prompt("Categories (comma separated):") || "";
  // split by ',' and remove leading and trailing white-spaces
  info["categories"] = categories.split(",").map((cat) => { return cat.trim().toLowerCase(); });

  var tags = window.prompt("Tags (comma separated):") || "";
  // split by ',' and remove leading and trailing white-spaces
  info["tags"] = tags.split(",").map((tag) => { return tag.trim().toLowerCase(); });

  info["template"] = info["html-tag"] + ".html";

  createTemplate(el, info);
}

export  function createTemplate(rootElement, info) {
  var template = document.createElement("template");
  template.id = info["html-tag"];

  var fragment = template.content;

  // collect styles
  // Maybe we should not filter rules due to dynamically
  // assigned classes?
  var combinedStyle = collectAppliedCssRules(rootElement);

  // the host should be displayed as inline-block to have the correct width and height
  combinedStyle += "\n:host {display: inline-block;}"

  // apply style
  var styleElement = document.createElement("style");
  styleElement.innerHTML = combinedStyle;
  fragment.appendChild(styleElement);

  // clone root
  var clone = rootElement.cloneNode(true);
  fragment.appendChild(clone);

  return saveTemplate(template, info);
}

function saveTemplate(template, info) {
  var serializer = new XMLSerializer();
  var registrationScript = componentLoader.createRegistrationScript(template.id);

  var templateString = serializer.serializeToString(template);
  var regScriptString = serializer.serializeToString(registrationScript);
  // fix some bad escaping
  var completeHTML = (templateString + regScriptString).replace(new RegExp("&lt;", "g"),"<").replace(new RegExp("&gt;", "g") ,">");

  // beautify
  if (typeof htmlBeautify === "function") {
    completeHTML = htmlBeautify(completeHTML);
  }

  var templateEditor = componentLoader.createComponent("lively-editor");
  componentLoader.openInWindow(templateEditor).then((w) => {
    templateEditor.setURL(lively4url + "/templates/" + template.id + ".html");
    templateEditor.setText(completeHTML);
    w.style.left = "0px";
    w.style.top = "0px";
  });

  var jsonEditor = componentLoader.createComponent("lively-editor");
  componentLoader.openInWindow(jsonEditor).then((w) => {
    jsonEditor.setURL(lively4url + "/templates/" + template.id + ".json");
    jsonEditor.setText(JSON.stringify(info, null, 2));
    w.style.left = "100px";
    w.style.top =  "100px";
  });

  return completeHTML;
}

export function packShadowDOM(subtreeRoot) {
  var shadow;
  // if there is a shadow root already,
  // we clean it up, since we cannot create a new one
  if (subtreeRoot.shadowRoot) {
    shadow = subtreeRoot.shadowRoot;
    $(shadow.children).each(function(idx) {
      shadow.removeChild(this);
    });
  } else {
    shadow = subtreeRoot.createShadowRoot();
  }

  // We need to bring the styles into the shadow root,
  // because otherwise they will not be applied to the
  // shadow dom elements.

  // collect styles
  // Maybe we should not filter rules due to dynamically
  // assigned classes?
  var combinedStyle = collectAppliedCssRules(subtreeRoot);

  // apply style
  var styleElement = document.createElement("style");
  styleElement.innerHTML = combinedStyle;
  shadow.appendChild(styleElement);

  // make a shallow copy of the children object,
  // since subtreeRoot.children changes in the following loop
  var children = $.extend({}, subtreeRoot.children);
  // append all children to the shadow dom
  for (var i = 0; i < children.length; i++) {
    shadow.appendChild(children[i]);
  }
}

export function unpackShadowDOM(subtreeRoot) {
  var shadow = subtreeRoot.shadowRoot;
  if (!shadow) {
    return;
  }

  // move all elements but style out of the shadow dom
  $(shadow.children).filter(":not(style)").each(function(idx) {
    subtreeRoot.appendChild(this);
  });

  // We cannot remove the shadow root, so to make the content visible,
  // add a content node to the shadow dom. This should be equivalent to having
  // no shadow dom at all.
  shadow.appendChild(document.createElement("content"));
}

function collectAppliedCssRules(rootElement) {
  var combinedStyle = [];
  var styles = document.styleSheets;
  for (var i = 0; i < styles.length; i++) {
    var styleSheet = styles[i];
    if (!styleSheet.cssRules) {
      continue;
    }
    for (var j = 0; j < styleSheet.cssRules.length; j++) {
      var rule = styleSheet.cssRules[j];
      var selector = rule.selectorText;
      // just add those rule that match an element in the subtree
      if (selectorMatchesTree(selector, rootElement)) {
        if (combinedStyle.indexOf(rule.cssText) == -1) {
          combinedStyle.push(rule.cssText);
        }
      }
    }
  }

  return combinedStyle.join("\n");
}

function selectorMatchesTree(selector, rootElement) {
  // conservative css rule collection for now

  // if root matches selector, we are done
  if (rootElement.matches(selector)) {
    return true;
  }

  // if not, check all children
  for (var i = 0; i < rootElement.children.length; i++) {
    if (selectorMatchesTree(selector, rootElement.children[i])) {
      return true;
    }
  }

  // if we reach this, none of the tree nodes matches the selector
  return false;
}

export default class ComponentCreator {

  static async visitURL(container, url) {
    container.followPath(url)
    await container.editFile(url)
    container.focus()
  }

  static async copyTemplate(dir, component, type) {
    var filename = component + "." + type
    var classname = component.split(/-/).map(ea => Strings.toUpperCaseFirst(ea)).join("")
    var url = dir  + "/" + filename
    if (await lively.files.existFile(url)) {
      lively.notify("Could not create " + url + ", beacuse it already exists!")
    } else {
      var templatejs_src = await lively.files.loadFile(lively4url + "/templates/template." + type)
      templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_CLASS/g, classname)
      templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_ID/g, component)
      await lively.files.saveFile(url, templatejs_src)
    }
  }

  static async createEntry(container, input) {
    var path = "" + container.getPath();
    var dir = path.replace(/[^/]*$/,"");
    var component = input.value
    if (!component || component.leght == 0) {
      throw new Error("please specify a web component name")      
      return
    }
    if (!component.match(/-/)) {
      throw new Error("we components must have a '-' (dash) in it's name")
    }
  
    
    await this.copyTemplate(dir, component, "js")
    await this.copyTemplate(dir, component, "html")
    lively.components.resetTemplatePathCache()

    this.visitURL(container, dir + "/" + component + ".js")
  }

  static  async createUI(container) { 
    var div  = document.createElement("div");
    var input = document.createElement("input");
    input.placeholder = "lively-new-component";
    div.appendChild(input);
    var button = document.createElement("button");
    button.addEventListener("click", async () => {
      try {
        await this.createEntry(container, input)
      } catch(e) {
        errorMsg.innerHTML = "" + e.message
      }
    });
    button.innerHTML = "create";
    div.appendChild(button);

    var errorMsg = document.createElement("div")
    errorMsg.style.color = "red"
    div.appendChild(errorMsg)
    
    input.focus();
    input.select();
    return div;
  }
  
  static async listComponentsUI(container) {
    if(!container || !container.getPath) {
      return "no container as parentPath";
    }
    var path = "" + container.getPath();
    var dir = path.replace(/[^/]*$/,"")
    var opts = JSON.parse(await lively.files.statFile(dir))
    var testdir = lively4url + "/test/templates/"
    var tests = JSON.parse(await lively.files.statFile(testdir)).contents.map(ea => ea.name)

    var list = document.createElement("ul")
    _.sortBy(opts.contents, ea => ea.name)
      .filter(ea => ea.name.match(/html$/) && ea.name !== "index.html")
      .forEach(ea => {
        var li = document.createElement("li")

        var span = document.createElement("span")
        span.textContent = ea.name.replace(/\.html/," ")
        li.appendChild(span)

        var a = document.createElement("a")
        a.innerHTML = "html"
        a.href = ea.name
        a.onclick = (evt) => {
          evt.preventDefault()
          container.followPath(dir + "/" + ea.name)
          return true
        }
        li.appendChild(a)

        var span = document.createElement("span")
        span.textContent = " "
        li.appendChild(span)

        var classFile =  ea.name.replace(/\.html/,".js")
        if (opts.contents.find(ea => ea.name == classFile)) {
          var classLink = document.createElement("a")
          classLink.innerHTML = "js"
          classLink.href = classFile
          classLink.onclick = (evt) => {
            evt.preventDefault()
            container.followPath(dir + "/" + classFile)
            return true
          }
          li.appendChild(classLink)
        }

        var span = document.createElement("span")
        span.textContent = " "
        li.appendChild(span)

        var testFile =  ea.name.replace(/\.html/,"-test.js")
        if (tests.indexOf(testFile) !== -1) {
          var testLink = document.createElement("a")
          testLink.innerHTML = "test"
          testLink.href = testFile
          testLink.onclick = (evt) => {
            evt.preventDefault()
            container.followPath(testdir + "/" + testFile)
            return true
          }
          li.appendChild(testLink)
        }

        list.appendChild(li)
      })
    return list
  }

}

