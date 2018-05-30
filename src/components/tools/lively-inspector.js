/*
 * # LivelyInspector 
 * A tool similar to the chrome "Elements" pane and the JavaScript object explorer
 */
import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {sortAlphaNum} from "src/client/sort.js"
import { getTempKeyFor } from 'utils';

function truncateString(s, length, truncation) {
  length = length || 30;
  truncation = truncation === undefined ? '...' : truncation;
  return s.length > length ? s.slice(0, length - truncation.length) + truncation : String(s);
}
// truncateString("Hello World", 8, "...")


export default class Inspector   extends Morph {

  initialize() {
    if (this.getAttribute("target")) {
      this.inspect(document.querySelector(this.getAttribute("target")))
    }
    // lively.notify("[inspector] intialize");  
    this.get("#editor").enableAutocompletion();
  
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
  }

  displayValue(value, expand, name) {
    if (name) {
      let attrValue;
      if (value && typeof value === 'symbol') {
        attrValue = value.toString();
      } else {
        attrValue = JSON.stringify(value).replace(/</g,"&lt;");
      }
      let node = <div class="element">
        <span class='attrName'>{name}:</span>
        <span class='attrValue'>{attrValue}</span>
      </div>;
      return node;
    } else {
      let node = document.createElement("pre");
      node.innerHTML = JSON.stringify(value);
      return node;
    }
  }

  onContextMenu(evt) {
    if (this.targetObject && !evt.shiftKey) { 
      evt.preventDefault();
      evt.stopPropagation();
      if (this.targetObject instanceof Array) {
        var menu = new ContextMenu(this, [
              ["inspect as table", () => Inspector.inspectArrayAsTable(this.targetObject)],
            ]);
        menu.openIn(document.body, evt, this);
      } else if (this.targetObject.tagName) {
        // for all html elements
        lively.openContextMenu(document.body, evt, this.selection || this.targetObject);
        return true
      }
	    return false;
    } 
  }

  displayFunction(value, expand, name) {
    var node = <div></div>;;
    node.classList.add("element");
    node.innerHTML =  "<span class='attrName'>"+ name +":</span> <span class='attrValue'>" + ("" +value).replace(/</g,"&lt;") + "</span>";
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
    this.dispatchEvent(new CustomEvent("select-object", {detail: {node: node, object: obj}}));
  }
  
  renderObject(node, obj, expanded, name) {
    // handle system objects... 
    var handlerMethod = "render" +obj.constructor.name + "Object"
    node.type = "Object"
    node.isExpanded = expanded;
    if (!name) {
      name = "";
    }
    var className = obj.constructor.name;
    if (this.isAstMode() && obj.type) {
      className = obj.type
    }
    
    node.innerHTML = this.expandTemplate(node) +
      `<span class='attrName expand'> ${name}</span><span class="syntax">:</span>
      <a id='tagname' class='tagname'>${className}</a> ` +
      '<span class="syntax">{</span>' +
       this.contentTemplate() +
      '<span class="syntax">}</span>';
  
    this.attachHandlers(node, obj, name, "renderObject");
    
    var contentNode = node.querySelector("#content");
    if (node.isExpanded) {
      contentNode.innerHTML = "";
      if (obj instanceof Function) {
        var childNode = this.displayFunction(obj, expand, name)
        if (childNode) contentNode.appendChild(childNode); 
      }
      
      this.allKeys(obj).sort(sortAlphaNum).forEach( ea => { 
        try {
          var value = obj[ea]
        } catch(e) {
          console.log("[inspector] could not display " + ea + " of " + obj)
          return
        }
        if (value == null) return;  
        var childNode = this.displayObject(value, false, ea, obj)
        if (childNode) contentNode.appendChild(childNode); // force object display        
      });
    }
        
    if (this[handlerMethod] &&  node.isExpanded ) {
      return this[handlerMethod](contentNode, obj)
    }
  }
  
  displayObject(obj, expand, name) {
    if (!(obj instanceof Object)) {
      return this.displayValue(obj, expand, name); // even when displaying objects.
    }
    if ((obj instanceof Function)) {
      return this.displayFunction(obj, expand, name); // even when displaying objects.
    }
    
    var node = <div class="element"></div>;
    node.pattern = "NAME " + name
    node.name = name
    this.renderObject(node, obj, expand, name);
    return node;
  }
  
  changeAttributeValue(obj, attrName, attrValue) {
    obj.setAttribute(attrName, attrValue);
    lively.notify("edited " + attrName + " to " + attrValue);
  }
  
  expandTemplate(node) {
    return "<span class='syntax'><a class='expand'>" +
      (node.isExpanded ? 
        "<span style='font-size:9pt'>&#9660;</span>" : 
        "<span style='font-size:7pt'>&#9654</span>") + "</span></a></span>";
  }
  
  contentTemplate(content) {
    return "<span id='content'><a id='more' class='more'>"+ (content ? content : "...")+ "</a></span>";
  }

  get quoteTemplate() {
    return `<span class='syntax'>"</span>`;
  }
  
  attachHandlers(node, obj, name, renderCall = "render") {
    node.target = obj;
    // jqyery would make this cleaner here...
    var moreNode = node.querySelector("#more");
    if (moreNode) {
      moreNode.onclick = evt => {
        this[renderCall](node, obj, true, name);
      };
      // #TODO: does not work, ... yet
      moreNode.draggable="true";
      moreNode.addEventListener('dragstart', evt => {
        evt.dataTransfer.setData("javascript/object", getTempKeyFor(obj));
      });
    };
    node.querySelectorAll(".expand").forEach(expandNode => {
      expandNode.onclick = evt => {
        this[renderCall](node, obj, !node.isExpanded, name);
      }
    });
    const tagNode = node.querySelector("#tagname");
    if (tagNode) tagNode.addEventListener('click', evt => {
      this.onSelect(node, obj);
    });
  }
  
  renderAttributes(node, obj) {
    if (obj.attributes) {
      var attrNode = node.querySelector("#attributes");
      Array.from(obj.attributes).forEach(ea => {
        var eaNode = document.createElement("span");
        var value = "" + ea.value;
        var maxvaluelength = 60;
        if (value.length > maxvaluelength) {
          var shortenValue = true
          value = value.slice(0, maxvaluelength) + "..."
        }
        eaNode.innerHTML = ` <span class='attrName'>${ea.name}=</span>${this.quoteTemplate}<span class="attrValue">${value}</span>${this.quoteTemplate}`;
        var valueNode = eaNode.querySelector(".attrValue") ;
        // Editing of attribute values in inspector
        if (!shortenValue) {
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
        }
        attrNode.appendChild(eaNode);
      });
    }
  }

  renderHeader(node, obj) {
    
    var tagName = obj.tagName || obj.nodeName;
    if (obj instanceof ShadowRoot) {
      tagName = "shadowroot";
    }
    if (obj instanceof Comment) {
      tagName = "comment";
    }
    var lt = "<span class='syntax'>&lt;</span>";
    var gt = "<span class='syntax'>&gt;</span>";
    node.innerHTML = this.expandTemplate(node)  + 
      (obj.tagName && !obj.livelyIsParentPlaceholder ? lt : "")+
      `<a id='tagname' class='expand tagname'>${tagName.toLowerCase()}</a>`+
      `<span id='attributes'></span>` +
      (obj.tagName && !obj.livelyIsParentPlaceholder ? gt : "")+
      this.contentTemplate(truncateString(obj.textContent, 40, "..")) +
      (obj.tagName && !obj.livelyIsParentPlaceholder ? 
        `${lt}/<span class='tagname'>${tagName.toLowerCase()}</span>${gt}` : "");
    if (tagName == "shadowroot") {
      node.innerHTML = this.expandTemplate(node) + "<a id='tagname' class='tagname'> #shadow-root</a>" +
        this.contentTemplate(); 
    }
    
    if (tagName == "comment") {
      node.innerHTML = "<a id='tagname' class='tagname'>&lt!-- </a>" + 
        this.contentTemplate() +" --&gt" ;
    }
    // if (!node.isAutoExpanded) html = this.expandTemplate + html
  }

  
  renderNode(node, obj, expanded) {
    node.isExpanded = true && expanded;
    if (!obj.textContent || obj.textContent.length < 80) {
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
        contentNode.appendChild(this.display(obj.shadowRoot, expandChildren, null, obj));
      }  
      obj.childNodes.forEach( ea => { 
        contentNode.appendChild(this.display(ea, expandChildren, null, obj));
      });
            

      var hasProperties = this.allKeys(obj).length > 0;
      if (hasProperties && !obj.livelyIsParentPlaceholder) {
        var props = this.displayObject(obj, false, "#Properties");
        contentNode.appendChild(props);
        if (props.childNodes.length == 0) props.remove() // clean up 
        
      }
      
      if (obj.livelyInspect) {
        try {
          obj.livelyInspect(contentNode, this)
        } catch(e) {
          var selection = <div class="element" style="color:red"><b>Error in livleyInspect:</b> {e}</div>
          contentNode.appendChild(selection)
        }
      } 
      
      
    }
  }
  
  
  renderText(node, obj, expanded) {
    if (obj.textContent.match(/^[ \n]*$/)) 
      return; // nothing to render here... skip, empty lines or just spaces
    if (obj.textContent && obj.textContent.length > 100)
      node.innerHTML = "<pre>" +  obj.textContent + "</pre>";
    else {
      console.log("renderText " + obj)
      node.innerHTML =  obj.textContent;
      if (obj instanceof Text) {
        node.onclick = evt => {
          node.contentEditable = true;
          return true;
        };
        // accept changes in content editable attribute value
        node.onkeydown = evt => {
          if(evt.keyCode == 13) { // on enter -> like in input fields
           node.contentEditable = false;
            obj.textContent =  node.textContent;
            evt.preventDefault();
          }
        };          
      }
      
    }
  }
  
  displayText(obj, expanded, parent) {
    var node = document.createElement("span");
    node.setAttribute("class","element");
    this.render(node, obj, expanded); 
    return node;
  }

  findParentNode(obj) {
    return obj.parentNode || obj.host;
  }
    
  displayNode(obj, expanded, parent) {
    var node;
    var parentNode = this.findParentNode(obj);
    if (!parent && parentNode) {
      var tmpParent = {tagName: "...", textContent: "", childNodes: [obj], livelyIsParentPlaceholder: true };
      node = this.displayNode(tmpParent, true, tmpParent);
      var tagNode = node.querySelector("#tagname");
      if (tagNode) tagNode.onclick = (evt) => {
        this.inspect(parentNode);
      };
      return node;
    } else if (obj.tagName) {
      node = <div></div>;
      node.setAttribute("class", "element tag");
    } else if (obj instanceof ShadowRoot) {
      node = <div></div>;
      node.setAttribute("class", "element shadowroot");
    } else if (obj instanceof Comment) {
      node = <div></div>;
      node.setAttribute("class", "element comment");
    } else if (obj instanceof Node) {
      node = <div></div>;
      node.setAttribute("class", "element");
    } else {
      // Fallback... 
      node = document.createElement("span");
      node.setAttribute("class","element");
    }
    this.render(node, obj, expanded); 
    return node;
  }
  
  isNode(obj) {
    return obj instanceof Node || (obj instanceof Object && obj.livelyIsParentPlaceholder);
  }
  
  render(node, obj, expanded) {
    
    
    if (obj instanceof Text) {
      return this.renderText(node, obj, expanded);
    } else if (this.isNode(obj) && node.type != "Object") {
      return this.renderNode(node, obj, expanded);
    } else if (typeof(obj) == "object") {
      return this.renderObject(node, obj, expanded, node.name);
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
    if (!obj) {
      return 
    }
    
    if (obj.id) {
      this.setAttribute("target", "#" + obj.id);
    }
    if (this.targetObject) {
      var oldViewState = this.getViewState()
    }
    
    this.targetObject = obj;
    this.get("#editor").doitContext = obj;
    this.get("#container").innerHTML = "";
    // special case for inspecting single dom nodes
    var content= this.display(obj, true, null, null);
    this.get("#container").appendChild(content);
    this.updatePatterns(this.get("#container").childNodes[0])
    
    if (oldViewState) {
      this.setViewState(oldViewState)
    }
    return content;
  }
  
  allKeys(obj) {
    var keys = []
    for(var i in obj) {
      if (obj.hasOwnProperty(i) || obj.__lookupGetter__(i)) {
        keys.push(i);
      }
    }
    if (!this.isAstMode()) {
      if (obj && this.allKeys(obj.__proto__).length > 0)
        keys.push("__proto__")
    }
    return _.sortBy(keys)
  }
  
  isAstMode() {
    return this.getAttribute("type") == "ast"
  }
  
  hideWorkspace() {
    this.get("#container").style.flex = 1;
    this.get("#editor").style.display = "none";
    this.get("lively-separator").style.display = "none";
  }

  showWorkspace() {
    this.get("#container").style.flex = 0.66;
    this.get("#editor").style.display = "block";
    this.get("lively-separator").style.display = "block";
  }
  
  
  updatePatterns(node) {
    var obj = node.target
    if (node.target) {
      if(node.pattern) {
        // do nothing
      } else if(obj.id) {
        node.pattern = "ID " + obj.id
      } else if(obj instanceof ShadowRoot) {
        node.pattern = "shadow-root"
      } else {
        node.pattern = "tag " + obj.tagName + " " + obj.id
        // check if siblings have same pattern
      }
      if (node.parentElement) {
      if (_.find(node.parentElement.childNodes, ea => ea && ea !== node && (ea.pattern == node.pattern))) {
          node.pattern += " X" // unique... but repeatable
        }
      }
    } else {
      node.pattern = "NOTARGET"
    }
    // lively.showElement(node).textContent = "U=" + node.pattern
    var content = node.querySelector("#content")
    if (content) content.childNodes.forEach( ea => {
      this.updatePatterns(ea)
    })
  }
  
  // JSON.stringify(this.getViewState())
  getViewState() {
    return this.captureViewState(this.get("#container").childNodes[0])
  }
  
  /*
    this.setViewState( {"children":[{"pattern":"","children":[{"pattern":"shadowRoot","children":[{"pattern":"","children":[]}]},{"pattern":"#Properties","children":[{"pattern":"attributes","children":[]}]}]}]})
  */
  setViewState(state) {
    return this.applyViewState(this.get("#container").childNodes[0], state)
  }
  
  applyViewState(node, state) {
    // lively.showElement(node).textContent = "P=" + state.pattern

    if (!node.querySelector) return; // text node
    
    this.expandNode(node)
    var content = node.querySelector("#content")
    if (content) {
      var children = _.filter(content.childNodes, 
        ea => ea.classList.contains("element"))
      state.children.forEach( ea => {
        var child = children.find( c => c.pattern == ea.pattern)
        if (child) this.applyViewState(child, ea) 
      })
    }
  }
  
  expandNode(node) {
    if (node.isExpanded) return
    this.render(node, node.target, true)
  }
  
  captureViewState(node) {
    var result =  { 
      pattern: node.pattern,
      children: []}
      
    if (!node.querySelector) return result; // text node

    var content = node.querySelector("#content")
    if (content) {
      _.filter(content.childNodes, ea => ea.isExpanded).forEach(ea => {
        result.children.push(this.captureViewState(ea))        
      })
    }
    return result
  }

  renderInterable(contentNode, obj) {
    if (!contentNode) return
    contentNode.innerHTML = ""
    var keys = []
    try {
      keys = obj.keys() // illegal invocation?
    } catch(e) {}
    for(var ea of keys) {
      var node = this.displayObject(obj.get(ea), true, ea)
      if (node) contentNode.appendChild(node);   
    }
  }
  
  // callbacks for system objects...
  renderHeadersObject(contentNode, obj) {
    this.renderInterable(contentNode, obj)
  }
  
  // callbacks for system objects...
  renderMapObject(contentNode, obj) {
    this.renderInterable(contentNode, obj)
  }
  
  static inspectArrayAsTable(array) {
    var div = <div></div>;
    div.innerHTML = "<table>" +lively.allKeys(array[0]).map( key => {
    	return "<tr><td><b>" + key +"</b></td>" + array.map( ea =>  "<td>" + (ea[key] + "").slice(0, 50) +"</td>").join("")+"</tr>"
    }).join("\n") + "</table>";
    div.style.overflow = "auto";
    lively.components.openInWindow(div, undefined, "Inspect Array");
  }
  
  livelyExample() {
    this.inspect(document.body)
  }
  
  livelyMigrate(oldInstance) {
    this.inspect(oldInstance.targetObject) ;
    var viewState  = oldInstance.getViewState()
    this.setViewState(viewState)
  } 
}
