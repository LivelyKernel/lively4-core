/*
 * # LivelyInspector 
 * A tool similar to the chrome "Elements" pane and the JavaScript object explorer
 */
import Morph from './Morph.js';

export default class Inspector   extends Morph {

  displayValue(value) {
    var node = document.createElement("pre");
    node.innerHTML = JSON.stringify(value);
    return node;
  }
  
  /*
   * called, when selecting a subobject 
   */
  onSelect(node, obj) {
    if (this.selectedNode)
      this.selectedNode.classList.remove("selected")
    this.selectedNode  = node
    this.selectedNode.classList.add("selected")
  
    this.selection = obj;
    lively.showElement(obj)
    window.that = obj // #Experimental
    this.get("#editor").doitContext = obj;
  }
  
  displayObject(object) {
    var node = document.createElement("ul");
    var createChild = (ea) => {
      var child = document.createElement("span");
      child.innerHTML = "" + object[ea] + "...";
      child.onclick = evt => {
        child.innerHTML = "";
        child.appendChild(this.display(object[ea]));
        evt.stopPropagation();
      };
      return child;
    };
  
    Object.keys(object).forEach( ea => {
      var eaNode = document.createElement("li");
      eaNode.innerHTML = "" + ea  + ": ";
      eaNode.onclick = evt => {
        eaNode.innerHTML = "" + ea  + ": ";
        eaNode.appendChild(createChild(ea));
        evt.stopPropagation();
      };
      eaNode.appendChild(createChild(ea));
      node.appendChild(eaNode);
    });
    return node;
  }
  
  changeAttributeValue(obj, attrName, attrValue) {
    obj.setAttribute(attrName, attrValue)
    lively.notify("edited " + attrName + " to " + attrValue)
  }
  
  
  renderNode(node, obj, expanded) {
    node.isExpanded = expanded || obj.textContent.length < 80;
    if (expanded === false) {
      node.isExpanded = false // force colapse 
    }
    
    var tagName = obj.tagName;
    if (obj instanceof ShadowRoot) {
      tagName = "shadowroot";
    }
    if (obj instanceof Comment) {
      tagName = "comment";
    }
    
    if (!tagName) {
      if (obj.textContent.match(/^[ \n]*$/)) return node
      if (obj.textContent.length > 100)
        node.innerHTML = "<pre>" +  obj.textContent + "</pre>";
      else
        node.innerHTML = obj.textContent;
      
      return node;
    }
    var expand = "<span class='syntax'><a id='expand'><span style='font-size:9'>&#9654;</span></a></span>"
    var lt = "<span class='syntax'>&lt;</span>"
    var gt = "<span class='syntax'>&gt;</span>"
    var content = "<span id='content'><a id='more' class='more'>...</a></span>"
    node.innerHTML = `${expand}${lt}`+
      `<a id='tagname' class='tagname'>${tagName.toLowerCase()}</a>`+
      `<span id='attributes'></span>${gt}` + content +
      `${lt}<span class='tagname'>${tagName.toLowerCase()}</span>${gt}`;
    if (tagName == "shadowroot") {
      node.innerHTML = expand + "<a id='tagname' class='tagname'>#shadow-root</a>" +
        content 
    }
    if (tagName == "comment") {
      node.innerHTML = expand + "<a id='tagname' class='tagname'>&lt!-- </a>" + content +" --&gt" 
    }
    var quote = '<span class="syntax">"</span>'
    if (obj.attributes) {
      var attrNode = node.querySelector("#attributes")
      lively.array(obj.attributes).forEach(ea => {
        var eaNode = document.createElement("span")
        eaNode.innerHTML = ` <span class='attrName'>${ea.name}=</span>${quote}<span class="attrValue">${ea.value}</span>${quote}`
        var valueNode = eaNode.querySelector(".attrValue") 
        // Editing of attribute values in inspector
        valueNode.onclick = evt => {
          eaNode.querySelector(".attrValue").contentEditable = true
          return true
        }
        // accept changes in content editable attribute value
        valueNode.onkeydown = evt => {
          if(evt.keyCode == 13) { // on enter -> like in input fields
           valueNode.contentEditable = false
            this.changeAttributeValue(obj, ea.name, valueNode.textContent)
            evt.preventDefault();
          }
        }
        attrNode.appendChild(eaNode)
      })
    }
    
    if (node.isExpanded) {
      node.querySelector('#expand').innerHTML = "▼";
    }

    var contentNode = node.querySelector("#content");
    node.querySelector("#more").onclick = (evt) => {
      this.renderNode(node, obj, true);
    };
    node.querySelector("#expand").onclick = (evt) => {
      this.renderNode(node, obj, !node.isExpanded);
    };
    node.querySelector("#tagname").onclick = (evt) => {
      this.onSelect(node, obj);
    };

   
    
    if (node.isExpanded) {
      contentNode.innerHTML = "";
      if (obj instanceof Comment) {
        contentNode.innerHTML = obj.textContent
      }
      if (obj.shadowRoot) {
        contentNode.appendChild(this.displayNode(obj.shadowRoot))  ;
      }  
      obj.childNodes.forEach( ea => { 
        contentNode.appendChild(this.displayNode(ea));
      });
      
    }
  }
  
  displayNode(obj, expanded) {
    var node;
    if (obj.tagName) {
      node = document.createElement("div");
      node.setAttribute("class","element tag");
    } else if (obj instanceof ShadowRoot) {
      node = document.createElement("div");
      node.setAttribute("class","element shadowroot");
    } else if (obj instanceof Comment) {
      node = document.createElement("div");
      node.setAttribute("class","element comment");
    } else {
      node = document.createElement("span");
      node.setAttribute("class","element");

    }
    node.target = obj
    this.renderNode(node, obj, expanded); 
    return node;
  }
  
  display(obj, expanded) {
    if (obj instanceof HTMLElement) {
     return this.displayNode(obj, expanded);
     // return this.displayObject(obj)
    } else if (obj instanceof Object){
      return this.displayObject(obj, expanded);
    } else {
      return this.displayValue(obj, expanded);
    }
  }

  inspect(obj) {
    this.targetObject = obj;
    this.get("#editor").doitContext = obj;
    this.innerHTML = "";
    this.get("#container").appendChild(this.display(obj, true));
  }
  
  livelyMigrate(oldInstance) {
    this.inspect(oldInstance.targetObject) ;   
  } 
}
