
/*MD # LivelyInspector 
 
A tool similar to the chrome "Elements" pane and the JavaScript object explorer

Authors: @JensLincke

Keywords: #Tool #Widget #Core #Lively4

![](lively-inspector.png){width=500px}

MD*/


import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {sortAlphaNum} from "src/client/sort.js"
import { getTempKeyFor } from 'utils';
import _ from 'src/external/lodash/lodash.js'

/**
 * @usage: truncateString("Hello World", 8, "...")
 */
function truncateString(s = '', length = 30, truncation = '...') {
  return s.length > length ?
    s.slice(0, length - truncation.length) + truncation :
    String(s);
}

export default class Inspector extends Morph {

  initialize() {
    if (this.getAttribute("target")) {
      this.inspect(document.querySelector(this.getAttribute("target")))
    }
    // lively.notify("[inspector] intialize");  
    this.get("#editor").enableAutocompletion();
  
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
  }

  displayValue(value, expand, name) {
    if (name !== undefined && name !== null) {
      let attrValue;
      if (value && typeof value === 'symbol') {
        attrValue = value.toString();
      } else {
        attrValue = JSON.stringify(value).replace(/</g,"&lt;");
      }
      return <div class="element">
        <span class='attrName'>{name}:</span>
        <span class='attrValue'>{attrValue}</span>
      </div>;
    } else {
      return <pre>{JSON.stringify(value)}</pre>;
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
  
  /*
   * called, when selecting a subobject 
   */
  onSelect(node, obj) {
    if (this.selectedNode) {
      this.selectedNode.classList.remove("selected");
    }
    this.selectedNode = node;
    this.selectedNode.classList.add("selected");
  
    this.selection = obj;
    lively.showElement(obj);
    window.that = obj; // #Experimental
    this.get("#editor").doitContext = obj;
    this.dispatchEvent(new CustomEvent("select-object", {detail: {node: node, object: obj}}));
  }

  renderObject(node, obj, expand, name = '') {
    // handle system objects... 
    node.type = "Object"
    node.isExpanded = expand;

    var className = obj.constructor.name;
    if (this.isAstMode() && obj.type) {
      className = obj.type
    }
    
    node.innerHTML = '';
    node.appendChild(this.expandTemplate(node));
    node.appendChild(<span>
      <span class='attrName expand'> {name}</span><span class="syntax">:</span> 
    </span>)
    
    if(typeof obj === 'function') {
      //(/</g,"&lt;")
      node.appendChild(<span class='attrValue'>&#x0192;</span>);
      node.appendChild(<span class=''> {obj.name} </span>);
      node.appendChild(<span class=''>{truncateString(obj.toString(), 20, '...')}</span>);
    } else {
      node.appendChild(<a id='tagname' class='tagname'>{
            (className !== "Object" && className != "Array") ? className : ""
        }</a>)
    }
    node.appendChild(<span>
      <span class="syntax">{className == "Array" ? "[" : "{"}</span>{
          this.contentTemplate()
        }<span class="syntax">{className == "Array" ? "]" : "}"}</span>
    </span>)
  
    this.attachHandlers(node, obj, name, "renderObject");
    this.renderExpandedProperties(node, obj);
  }
  
  renderExpandedProperties(node, obj) {
    if(!node.isExpanded) { return; }
        
    var contentNode = node.querySelector("#content");

    if (obj.livelyInspect) {
      try {
        obj.livelyInspect(contentNode, this)
      } catch(e) {
        var selection = <div class="element" style="color:red"><b>Error in livleyInspect:</b> {e}</div>;
        contentNode.appendChild(selection);
      }
      return
    } 
      
    this.renderObjectdProperties(contentNode, obj)
  }
  
  renderObjectdProperties(contentNode, obj) {      
    if(obj && obj[Symbol.iterator]) {
      this.renderIterable(contentNode, obj);
      return;
    }
    
    contentNode.innerHTML = "";
    this.allKeys(obj).sort(sortAlphaNum).forEach( ea => {
      try {
        var value = obj[ea]
      } catch(e) {
        console.log("[inspector] could not display " + ea + " of " + obj)
        return
      }
      if (value == null) return;  
      var childNode = this.display(value, false, ea, obj)
      if (childNode) contentNode.appendChild(childNode); // force object display 
    });
  }
  
  displayObject(obj, expand, name) {
    if (!(obj instanceof Object)) {
      return this.displayValue(obj, expand, name); // even when displaying objects.
    }
    // if ((obj instanceof Function)) {
    //   return this.displayFunction(obj, expand, name); // even when displaying objects.
    // }
    
    var node = <div class="element"></div>;
    node.pattern = "NAME " + (name || '').toString()
    node.name = name
    this.renderObject(node, obj, expand, name);
    return node;
  }
  
  addVivideSelection(cb, node){
    const root = node ? node : this.container;
    const atts = root.querySelectorAll('.attrValue');
    for(let i = 0; i < atts.length; i++){
      const value = atts.item(i).innerHTML;
      atts.item(i).addEventListener('click', () => cb(value.startsWith('"') ? value.slice(1, -1) : value));
    }
  }
  
  changeAttributeValue(obj, attrName, attrValue) {
    obj.setAttribute(attrName, attrValue);
    lively.notify("edited " + attrName + " to " + attrValue);
  }
  
  expandTemplate(node) {
    return <span class='syntax'><a class='expand'>{node.isExpanded ? 
      <span style='font-size:9pt'>&#9660;</span> : 
      <span style='font-size:7pt'>&#9654;</span>
    }</a></span>;
  }
  
  contentTemplate(content) {
    return <span id='content'><a id='more' class='more'>{content ? content : "..."}</a></span>;
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
    }
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
    function quoteTemplate() {
      return <span class='syntax'>"</span>;
    }

    if (obj.attributes) {
      var attrNode = node.querySelector("#attributes");
      Array.from(obj.attributes).forEach(ea => {
        var value = "" + ea.value;
        var maxvaluelength = 60;
        if (value.length > maxvaluelength) {
          var shortenValue = true
          value = value.slice(0, maxvaluelength) + "..."
        }
        var eaNode = <span> <span class='attrName'>{ea.name}=</span>{quoteTemplate()}<span class="attrValue">{value}</span>{quoteTemplate()}</span>;
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
    node.innerHTML = '';

    if (obj === document) {
      return;
    }

    if (obj instanceof Document) {
      return;
    }

    
    
    if (obj instanceof ShadowRoot) {
      node.appendChild(this.expandTemplate(node)) 
      node.appendChild(<a id='tagname' class='tagname'> #shadow-root</a>)
      node.appendChild(this.contentTemplate()) 
      return;
    }

    if (obj instanceof Comment) {
      node.appendChild(<a id='tagname' class='tagname'>&lt!-- </a>)
      node.appendChild(this.contentTemplate());
      node.appendChild(document.createTextNode(" --&gt"))
      return;
    }

    var tagName = obj.tagName || obj.nodeName;
    var lt = () => <span class='syntax'>&lt;</span>;
    var gt = () => <span class='syntax'>&gt;</span>;
    const showTags = obj.tagName && !obj.livelyIsParentPlaceholder;
    node.appendChild(this.expandTemplate(node))
    if (showTags) { node.appendChild(lt()); }
    node.appendChild(<a id='tagname' class='expand tagname'>{tagName.toLowerCase()}</a>)
    node.appendChild(<span id='attributes'></span>)
    if (showTags) { node.appendChild(gt()); }
    
    node.appendChild(this.contentTemplate(truncateString(obj.textContent, 40, "..")))
    
    if(showTags) {
      node.appendChild(lt());
      node.appendChild(document.createTextNode("/"));
      node.appendChild(<span class='tagname'>{tagName.toLowerCase()}</span>);
      node.appendChild(gt());
    }

    // if (!node.isAutoExpanded) html = this.expandTemplate({}).outerHTML + html
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
    if (!contentNode) return 
    
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
            

      try {
        var hasProperties = this.allKeys(obj).length > 0;
        
      } catch(e) {
        console.warn("[inspector] allKeys failed", e)
      }
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
  
  displayText(obj, expanded) {
    var node = <span class="element"></span>
    this.render(node, obj, expanded); 
    return node;
  }

  findParentNode(obj) {
    try {
      return obj.parentNode || obj.host;
      
    } catch(e) {
      // we might be in a prototype ... where we should not dare to ask...
    }
  }
    
  displayNode(obj, expanded, parent) {
    try {
      var node;
      var parentNode = this.findParentNode(obj);
      if (!parent && parentNode) {
        var tmpParent = {
          tagName: "...",
          textContent: "",
          childNodes: [obj],
          livelyIsParentPlaceholder: true
        };
        node = this.displayNode(tmpParent, true, tmpParent);
        var tagNode = node.querySelector("#tagname");
        if (tagNode) tagNode.onclick = evt => {
          this.inspect(parentNode);
        };
        return node;
      } else if (obj.tagName) {
        node = <div class="element tag"></div>;
      } else if (obj instanceof ShadowRoot) {
        node = <div class="element shadowroot"></div>;
      } else if (obj instanceof Comment) {
        node = <div class="element comment"></div>;
      } else if (obj instanceof Node) {
        node = <div class="element"></div>;
      } else {
        // Fallback... 
        node = <span class="element"></span>;
      }
      this.render(node, obj, expanded); 
      return node;
    } catch(e) {
      debugger
      // dont't show red notification... because errors are expected sometimes
      console.error(e)
    }
  }
  
  isNode(obj) {
    if (obj.constructor === HTMLElement) return obj instanceof HTMLElement; // How to deal with META objects...?
    return obj instanceof Node || (obj instanceof Object && obj.livelyIsParentPlaceholder);
  }
  
  render(node, obj, expanded) {
    if (obj instanceof Text) {
      return this.renderText(node, obj, expanded);
    } else if (this.isNode(obj) && node.type != "Object") {
      return this.renderNode(node, obj, expanded);
    } else if (typeof obj == "object") {
      return this.renderObject(node, obj, expanded, node.name);
    } else if (typeof obj == "function"){
      // return this.renderFunction(node, obj, expanded, name);
    }
    // return this.renderValue(node, obj, expanded, name);
  }
  
  display(obj, expanded, name, parent) {
    // from most special to general
    if (obj instanceof Text) {
      return this.displayText(obj, expanded, parent);
    } else if (this.isNode(obj)) {
      return this.displayNode(obj, expanded, parent);
    } else if (typeof obj == "object" || typeof obj == "function") {
      return this.displayObject(obj, expanded, name);
    } else {
      return this.displayValue(obj, expanded, name);
    }
  }

  get container() { return this.get("#container"); }
  
  inspect(obj) {
    if (!obj) { return; }
    
    if (obj instanceof HTMLElement) {
      var cssSelector = lively.elementToCSSName(obj)
      this.setAttribute("target", cssSelector);      
    }
    
    if (this.targetObject) {
      var oldViewState = this.getViewState()
    }
    
    this.targetObject = obj;
    this.get("#editor").doitContext = obj;
    this.container.innerHTML = "";
    // special case for inspecting single dom nodes
    const content = this.display(obj, true, null, null);
    this.container.appendChild(content);
    this.updatePatterns(this.container.childNodes[0])
    
    if (oldViewState) {
      this.setViewState(oldViewState)
    }
    return content;
  }
  
  allKeys(obj) {
    var keys = []
    
    if(obj === null || !(typeof obj === 'object' || typeof obj === 'function')) { return []; }
    
    if (obj instanceof Response) return lively.allKeys(obj); // #TODO what does it make different?
    
    
    var allOwn = Object.getOwnPropertySymbols(obj).concat(Object.getOwnPropertyNames(obj))
    // for(var i in obj) {
    //   if (obj.hasOwnProperty(i) || obj.__lookupGetter__(i)) {
    //     keys.push(i);
    //   }
    // }
    keys = allOwn;
    if (!this.isAstMode() && !this.isSnapshotMode()) {
      
      if (obj && this.allKeys(obj.__proto__).length > 0 && (obj.__proto__ !== Object.prototype))
        keys.push("__proto__")
    }
    
    if (this.isSnapshotMode()) {
      keys = keys.filter(ea => !ea.startsWith("__tracker"))
    }
    
    
    return _.sortBy(keys)
  }
  
  isSnapshotMode() {
    return this.getAttribute("type") == "snapshot"
  }
  
  isAstMode() {
    return this.getAttribute("type") == "ast"
  }
  
  hideWorkspace() {
    this.container.style.flex = 1;
    this.get("#editor").style.display = "none";
    this.get("lively-separator").style.display = "none";
  }

  showWorkspace() {
    this.container.style.flex = 0.66;
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
    return this.captureViewState(this.container.childNodes[0])
  }
  
  /*
    this.setViewState( {"children":[{"pattern":"","children":[{"pattern":"shadowRoot","children":[{"pattern":"","children":[]}]},{"pattern":"#Properties","children":[{"pattern":"attributes","children":[]}]}]}]})
  */
  setViewState(state) {
    return this.applyViewState(this.container.childNodes[0], state)
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

  renderIterable(contentNode, obj) {
    if (!contentNode) return
    contentNode.innerHTML = ""
    var entries = []
    try {
      entries = obj.entries() // illegal invocation?
    } catch(e) {}
    for(let [key, value] of entries) {
      const node = this.display(value, true, key)
      if (node) contentNode.appendChild(node);   
    }
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
