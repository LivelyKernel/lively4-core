/*
 * # LivelyInspector 
 * A tool similar to the chrome "Elements" pane and the JavaScript object explorer
 */
import Morph from './Morph.js';

export default class Inspector   extends Morph {

  initialize() {
    lively.notify("[inspector] intialize")    
    this.get("#editor").enableAutocompletion()
  }

  displayValue(value) {
    var node = document.createElement("pre");
    node.innerHTML = JSON.stringify(value);
    return node;
  }

  displayFunction(value) {
    var node = document.createElement("div");
    node.classList.add("element");
    node.innerHTML = this.expandTemplate(node) + " function " + value.name + "(";
    // node.innerHTML = "<pre>" + value + "</pre>";
    return node;
  }
  
  /*
   * called, when selecting a subobject 
   */
  onSelect(node, obj) {
    if (this.selectedNode)
      this.selectedNode.classList.remove("selected");
    this.selectedNode  = node;
    this.selectedNode.classList.add("selected");
  
    this.selection = obj;
    lively.showElement(obj);
    window.that = obj; // #Experimental
    this.get("#editor").doitContext = obj;
  }
  
  renderObject(node, obj, expanded, name) {
    node.isExpanded = expanded;
    if (!name) {
      name = "";
    }
    var className = obj.constructor.name;
    
    node.innerHTML = `${this.expandTemplate(node)}`+
      ` <a id='tagname' class='tagname'>${name} ${className}</a> `+
      '<span class="syntax">{'+"</span>" +
       this.contentTemplate +
      '<span class="syntax">}'+"</span>";
  
    this.attachHandlers(node, obj);
    
    var contentNode = node.querySelector("#content");
    if (node.isExpanded) {
      contentNode.innerHTML = "";
      Object.keys(obj).forEach( ea => { 
          contentNode.appendChild(this.display(obj[ea], false, ea, obj));
      });
    }
  }
  
  displayObject(obj, expand, name) {
    var node = document.createElement("div");
    node.classList.add("element");
    this.renderObject(node, obj, expand, name);
    return node;
  }
  
  changeAttributeValue(obj, attrName, attrValue) {
    obj.setAttribute(attrName, attrValue);
    lively.notify("edited " + attrName + " to " + attrValue);
  }
  
  expandTemplate(node) {
    return "<span class='syntax'><a id='expand'><span style='font-size:9'>" +
      (node.isExpanded ? "&#9660;" : "&#9654") + "</span></a></span>";
  }
  
  get contentTemplate() {
    return "<span id='content'><a id='more' class='more'>...</a></span>";
  }

  get quoteTemplate() {
    return `<span class='syntax'>"</span>`;
  }
  
  attachHandlers(node, obj) {
    // jqyery would make this cleaner here...
    var moreNode = node.querySelector("#more");
    if (moreNode) moreNode.onclick = (evt) => {
      this.render(node, obj, true);
    };
    var expandNode = node.querySelector("#expand");
    if (expandNode) expandNode.onclick = (evt) => {
      this.render(node, obj, !node.isExpanded);
    };
    var tagNode = node.querySelector("#tagname");
    if (tagNode) tagNode.onclick = (evt) => {
      this.onSelect(node, obj);
    };
  }
  
  renderAttributes(node, obj) {
    if (obj.attributes) {
      var attrNode = node.querySelector("#attributes");
      lively.array(obj.attributes).forEach(ea => {
        var eaNode = document.createElement("span");
        eaNode.innerHTML = ` <span class='attrName'>${ea.name}=</span>${this.quoteTemplate}<span class="attrValue">${ea.value}</span>${this.quoteTemplate}`;
        var valueNode = eaNode.querySelector(".attrValue") ;
        // Editing of attribute values in inspector
        valueNode.onclick = evt => {
          eaNode.querySelector(".attrValue").contentEditable = true;
          return true;
        };
        // accept changes in content editable attribute value
        valueNode.onkeydown = evt => {
          if(evt.keyCode == 13) { // on enter -> like in input fields
           valueNode.contentEditable = false;
            this.changeAttributeValue(obj, ea.name, valueNode.textContent);
            evt.preventDefault();
          }
        };
        attrNode.appendChild(eaNode);
      });
    }
  }

  renderHeader(node, obj) {
    
    var tagName = obj.tagName;
    if (obj instanceof ShadowRoot) {
      tagName = "shadowroot";
    }
    if (obj instanceof Comment) {
      tagName = "comment";
    }
    var lt = "<span class='syntax'>&lt;</span>";
    var gt = "<span class='syntax'>&gt;</span>";
    node.innerHTML = this.expandTemplate(node)  + `${lt}`+
      `<a id='tagname' class='tagname'>${tagName.toLowerCase()}</a>`+
      `<span id='attributes'></span>${gt}` + this.contentTemplate +
      `${lt}/<span class='tagname'>${tagName.toLowerCase()}</span>${gt}`;
    if (tagName == "shadowroot") {
      node.innerHTML = this.expandTemplate(node) + "<a id='tagname' class='tagname'>#shadow-root</a>" +
        this.contentTemplate; 
    }
    
    if (tagName == "comment") {
      node.innerHTML = "<a id='tagname' class='tagname'>&lt!-- </a>" + 
        this.contentTemplate +" --&gt" ;
    }
    // if (!node.isAutoExpanded) html = this.expandTemplate + html
  }

  
  renderNode(node, obj, expanded) {
    node.isExpanded = true && expanded;
    if (obj.textContent.length < 80) {
      node.isExpanded = true;
      node.isAutoExpanded = true;
    }

    if (expanded === false) {
      node.isExpanded = false; // force colapse 
    }
    
    this.renderHeader(node, obj);
    this.renderAttributes(node, obj);

    var contentNode = node.querySelector("#content");
    this.attachHandlers(node, obj);

    var expandChildren = obj.livelyIsParentPlaceholder || false;

    if (node.isExpanded) {
      contentNode.innerHTML = "";
      if (obj instanceof Comment) {
        contentNode.innerHTML = obj.textContent.replace(/</,"&lt;").replace(/>/,"&gt;");
      }
      if (obj.shadowRoot) {
        contentNode.appendChild(this.display(obj.shadowRoot, expandChildren, null, obj))  ;
      }  
      obj.childNodes.forEach( ea => { 
        contentNode.appendChild(this.display(ea, expandChildren, null, obj));
      });
      
    }
  }
  
  renderText(node, obj, expanded) {
    if (obj.textContent.match(/^[ \n]*$/)) 
      return; // nothing to render here... skip, empty lines or just spaces
    if (obj.textContent.length > 100)
      node.innerHTML = "<pre>" +  obj.textContent + "</pre>";
    else {
      node.innerHTML =  obj.textContent;
    }
  }
  
  displayText(obj, expanded, parent) {
    node = document.createElement("span");
    node.setAttribute("class","element");
    this.render(node, obj, expanded); 
    return node;
  }
    
  displayNode(obj, expanded, parent) {
    var node;
     if (!parent && obj.parentElement) {
      var tmpParent = {tagName: "...", textContent: "", childNodes: [obj], livelyIsParentPlaceholder: true }
      node = this.displayNode(tmpParent, true, tmpParent)
      var tagNode = node.querySelector("#tagname");
      if (tagNode) tagNode.onclick = (evt) => {
        this.inspect(obj.parentElement)
      };
      node.target = node.parentElement
      return node
    } else if (obj.tagName) {
      node = document.createElement("div");
      node.setAttribute("class","element tag");
    } else if (obj instanceof ShadowRoot) {
      node = document.createElement("div");
      node.setAttribute("class","element shadowroot");
    } else if (obj instanceof Comment) {
      node = document.createElement("div");
      node.setAttribute("class","element comment");
    } else {
      // Fallback... 
      node = document.createElement("span");
      node.setAttribute("class","element");
    }
    node.target = obj;
    this.render(node, obj, expanded); 
    return node;
  }
  
  isNode(obj) {
    return obj instanceof HTMLElement ||  obj instanceof SVGElement || obj instanceof ShadowRoot || obj instanceof Comment || obj instanceof Text || (obj instanceof Object && obj.livelyIsParentPlaceholder);
  }
  
  render(node, obj, expanded) {
    if (obj instanceof Text) {
      return this.renderText(node, obj, expanded);
    } else if (this.isNode(obj)) {
      return this.renderNode(node, obj, expanded);
    } else if (typeof(obj) == "object"){
      return this.renderObject(node, obj, expanded, name);
    } else if (typeof(obj) == "function"){
      // return this.renderFunction(node, obj, expanded, name);
    } else {
      // return this.renderValue(node, obj, expanded, name);
    }
  }
  
  display(obj, expanded, name, parent) {
    // from most special to general
    if (obj instanceof Text) {
      return this.displayText(obj, expanded, parent);
    } else if (this.isNode(obj)) {
      return this.displayNode(obj, expanded, parent);
    } else if (typeof(obj) == "object"){
      return this.displayObject(obj, expanded, name, parent);
    } else if (typeof(obj) == "function"){
      return this.displayFunction(obj, expanded, name, parent);
    } else {
      return this.displayValue(obj, expanded, name, parent);
    }
  }

  inspect(obj) {
    this.targetObject = obj;
    this.get("#editor").doitContext = obj;
    this.get("#container").innerHTML = "";
    // special case for inspecting single dom nodes
    var content= this.display(obj, true, null, null)
    this.get("#container").appendChild(content);
    return content
  }
  
  livelyMigrate(oldInstance) {
    this.inspect(oldInstance.targetObject) ;   
  } 
}
