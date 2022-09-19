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

  var templateString = serializer.serializeToString(template);
  // fix some bad escaping
  var completeHTML = (templateString).replace(new RegExp("&lt;", "g"),"<").replace(new RegExp("&gt;", "g") ,">");

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

  static async copyTemplate(dir, component, type, templateURL = lively4url + "/templates/template.") {
    var filename = component + "." + type
    var classname = component.split(/-/).map(ea => Strings.toUpperCaseFirst(ea)).join("")
    var url = dir  + "/" + filename
    if (await lively.files.existFile(url)) {
      lively.notify("Could not create " + url + ", beacuse it already exists!")
    } else {
      var templatejs_src = await lively.files.loadFile(templateURL + "." + type)
      templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_CLASS/g, classname)
      templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_ID/g, component)
      await lively.files.saveFile(url, templatejs_src)
    }
  }

  static async createEntry(container, input, templateURL) {
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
    
    await this.copyTemplate(dir, component, "js", templateURL)
    await this.copyTemplate(dir, component, "html", templateURL)
    lively.components.resetTemplatePathCache()

    this.visitURL(container, dir + "/" + component + ".js")
  }

  static  async createUI(container, templateURL) { 
    var div  = document.createElement("div");
    var input = document.createElement("input");
    input.placeholder = "lively-new-component";
    div.appendChild(input);
    var button = document.createElement("button");
    button.addEventListener("click", async () => {
      try {
        await this.createEntry(container, input, templateURL)
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
  
  static async  updateComponentsUI(container, context) {
    if (!container || !container.getPath) {
      return "no container as parentPath";
    }
    var path = "" + container.getPath();
    var dir = path.replace(/[^/]*$/, "");
    var opts = JSON.parse((await lively.files.statFile(dir)));
    var testdir = lively4url + "/test/templates/";
    var tests = JSON.parse((await lively.files.statFile(testdir))).contents.map(ea => ea.name);

    var list = document.createElement("pre")
    _.sortBy(opts.contents, ea => ea.name).filter(ea => ea.name.match(/html$/) && ea.name !== "index.html").forEach(ea => {

      var name = ea.name.replace(/\.html/,"")

      var li = Array.from(context.querySelectorAll("li.component")).find(ea => ea.textContent.match(new RegExp(name + "( |$)")))
      if (!li) {
        // and here we go.... return markdown source... to be added manually 
        list.textContent += " - " +ea.name.replace(/\.html/, " ") + ' {.component}\n'
        return
      } else {
        // console.log("INDEX Markdown: found " + name)
      }

      li.appendChild((<span> </span>));

      li.appendChild((<a href={"open://" + name}>open</a>));
      li.appendChild((<span> </span>));

      var a = <a href={ea.name}>html</a>;
      a.onclick = evt => {
        evt.preventDefault();
        container.followPath(dir + "/" + ea.name);
        return true;
      };
      li.appendChild(a);

      li.appendChild((<span> </span>));

      var classFile = ea.name.replace(/\.html/, ".js");
      if (opts.contents.find(ea => ea.name == classFile)) {
        var classLink = document.createElement("a");
        classLink.innerHTML = "js";
        classLink.href = classFile;
        // classLink.onclick = evt => {
        //   evt.preventDefault();
        //   container.followPath(dir + "/" + classFile);
        //   return true;
        // };
        li.appendChild(classLink);
      }

      lively.html.fixLinks(li.querySelectorAll("a"), dir, url => container.followPath(url) )


      var span = document.createElement("span");
      span.textContent = " ";
      li.appendChild(span);

      var testFile = ea.name.replace(/\.html/, "-test.js");
      if (tests.indexOf(testFile) !== -1) {
        var testLink = document.createElement("a");
        testLink.innerHTML = "test";
        testLink.href = testFile;
        testLink.onclick = evt => {
          evt.preventDefault();
          container.followPath(testdir + "/" + testFile);
          return true;
        };
        li.appendChild(testLink);
      }
       li.appendChild(<br></br>);
       var imgFile = ea.name.replace(/\.html/, ".png");
      if (opts.contents.find(ea => ea.name == imgFile)) {
        var img = document.createElement("img");
        img.innerHTML = "";
        img.src = dir + imgFile;
        // img.onclick = evt => {
        //   evt.preventDefault();
        //   container.followPath(dir + "/" + classFile);
        //   return true;
        // };
        li.appendChild(img);
      }

    });

    var result = <div>{list}</div>
    return result
  }
}

