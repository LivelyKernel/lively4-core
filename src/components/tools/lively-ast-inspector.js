import Morph from 'src/components/widgets/lively-morph.js';
import { sortAlphaNum } from 'src/client/sort.js';
import babelDefault from 'systemjs-babel-build';
const { types: t } = babelDefault.babel;

export default class AstInspector extends Morph {
  
  async initialize() {
    this.windowTitle = "AST Inspector";
    this.registerButtons()

    lively.html.registerKeys(this);
  }
  
  get container() { return this.get("#container"); }
  
  inspect(obj) {
    if (!obj) return;
    
    if (this.targetObject) {
      var oldViewState = this.getViewState()
    }
    
    this.targetObject = obj;
    this.container.innerHTML = "";
    
    const content = this.display(obj, true, null);
    this.container.appendChild(content);
    this.updatePatterns(this.container.childNodes[0])
    
    if (oldViewState) {
      this.setViewState(oldViewState)
    }
    return content;
  }

/*MD # Configuration MD*/
  
  get configuration() {
    return this.configuration || lively.preferences.get("AstInspectorConfig");
  }
  
  get hidesLocationData() { return true; }
  get hidesTypeProperty() { return true; }
  get hidesMethods() { return true; }
  get hidesEmptyProperties() { return true; }

/*MD # Displaying MD*/

  getElementType(obj) {
    if (obj == null) return "Value";
    if (t.isNode(obj)) return "AstNode";
    if (Array.isArray(obj)) return "Array";
    if (typeof obj === "object" || typeof obj === "function") return "Object";
    return "Value";
  }

  getRenderCall(type) {
    return `render${type}`;
  }
  
  display(obj, expanded, key) {
    const element = this.elementTemplate();
    element.key = key;
    element.pattern = `NAME ${key || ''}`;
    element.target = obj;
    element.type = this.getElementType(obj);
    element.renderCall = this.getRenderCall(element.type);
    this.render(element, expanded);
    return element;
  }
    
/*MD # Rendering MD*/

  render(element, expanded) {
    element.innerHTML = '';
    element.isExpanded = expanded;
    this[element.renderCall || "renderValue"](element);
    this.attachHandlers(element);
    if (expanded) this.renderExpandedProperties(element);
  }
  
  renderAstNode(element) {
    [
      this.expansionIndicatorTemplate(element),
      this.keyTemplate(element.key),
      this.labelTemplate(element.target.type),
      this.summaryTemplate(`{${this.propertyPreview(element.target)}}`),
    ].forEach((child) => {
      if (child) element.appendChild(child);
    });
  }
  
  renderObject(element) {
    const label = element.target.constructor.name;
    
    [
      this.expansionIndicatorTemplate(element),
      this.keyTemplate(element.key),
      <span>
        <span class="syntax">&#123;</span>
        {this.summaryTemplate(this.propertyPreview(element.target))}
        <span class="syntax">&#125;</span>
      </span>
    ].forEach((child) => {
      if (child) element.appendChild(child);
    });
  }

  renderArray(element) {
    [
      this.expansionIndicatorTemplate(element),
      this.keyTemplate(element.key),
      this.summaryTemplate(`[${element.target.length} elements]`),
    ].forEach((child) => {
      if (child) element.appendChild(child);
    });
  }

  renderValue(element) {
    const json = JSON.stringify(element.target);
    element.appendChild(this.keyTemplate(element.key));
    element.appendChild(<span class='attrValue'>{json}</span>);
  }
  
  isLocationProperty(str) {
    return str === "loc"
            || str === "start"
            || str === "end";
  }
  
  isEmptyProperty(obj) {
    if (Array.isArray(obj)) return obj.length == 0;
    if (typeof obj === "undefined") return true;
    return false;
  }
  
  renderExpandedProperties(element) {
    const target = element.target;    
    const contentNode = element.querySelector("#content");
    if (!contentNode) return
    contentNode.innerHTML = "";

    if (target && target[Symbol.iterator]) {
      let entries = []
      try {
        entries = target.entries() // illegal invocation?
      } catch(e) {
        //do nothing
      }
      
      for (const [key, value] of entries) {
        contentNode.appendChild(this.display(value, false, key));
      }
      return;
    }
    
    this.allKeys(target).forEach(key => {
      if (this.isVisibleProperty(target, key)) {
        contentNode.appendChild(this.display(target[key], false, key));
      }
    });
  }
  
  isVisibleProperty(obj, prop) {
    return !(this.hidesTypeProperty && prop === "type")
            && !(this.hidesLocationData && this.isLocationProperty(prop))
            && !(this.hidesEmptyProperties && this.isEmptyProperty(obj[prop]))
            && !(this.hidesMethods && typeof value === "function");
  }
  
  propertyPreview(obj) {
    const trimLen = 30;
    const keys = this.allKeys(obj).filter(key => this.isVisibleProperty(obj, key));
    let str = '';
    let i = 0;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i) str += ', ';
      if (str.length > trimLen) {
        const remaining = keys.length - i;
        const replacement = `... +${remaining}`;
        if (remaining == 1 && key.length < replacement.length) {
          str += key;
        } else {
          str += replacement;
        }
        break;
      }
      str += key;
    }
    return str;
  }
  
  allKeys(obj) {
    if (!(typeof obj === 'object')) return [];
    const keys = Object.getOwnPropertyNames(obj);
    return keys.sort(sortAlphaNum);
  }
  
  expansionIndicatorTemplate(node) {
    return <span class='syntax'>
      <a class='expand'>
        {node.isExpanded
        ? <span style='font-size:9pt'>&#9660;</span>
        : <span style='font-size:9pt'>&#9654;</span>}
      </a>
    </span>;
  }

  elementTemplate() {
    return <div class="element"></div>;
  }
  
  labelTemplate(content) {
    return <a id='tagname' class='tagname expand'>{content}</a>
  }

  keyTemplate(content) {
    if (content == null) return null;
    return <span class='attrName expand'>
      {content}
      <span class="syntax">:</span> 
    </span>;
  }

  summaryTemplate(content) {
    return <span id='content'>
      <span id='more' class='more'>
        {content ? content : "..."}
      </span>
    </span>;
  }
  
/*MD # Handlers MD*/
  
  attachHandlers(element) {
    var moreNode = element.querySelector("#more");
    if (moreNode) {
      moreNode.onclick = evt => {
        this.render(element, true);
      };
    }
    element.querySelectorAll(".expand").forEach(expandNode => {
      expandNode.onclick = evt => {
        console.log("click");
        this.render(element, !element.isExpanded);
      }
    });
  }
  
  /*
   * called, when selecting a subobject 
   */
  onSelect(element) {
    const obj = element.target;
    if (this.selectedNode) {
      this.selectedNode.classList.remove("selected");
    }
    this.selectedNode = element;
    this.selectedNode.classList.add("selected");
  
    this.selection = obj;
    lively.showElement(obj);
    this.dispatchEvent(new CustomEvent("select-object", {detail: {node: element, object: obj}}));
  }
  
  onContextMenu(evt) {
    if (this.targetObject && !evt.shiftKey) {
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
  }

/*MD # View State MD*/
  
  setExpandStateForAllNodes(expandedness) {
    const root = this.container.childNodes[0];
    const recursion = (node, expandedness) => {
      node.isExpanded = expandedness;
      this.getChildren().forEach(child => recursion(child, expandedness))
    };
    
    recursion(root, expandedness);
    // Do we need to render?
  }
  
  getViewState() {
    return this.captureViewState(this.container.childNodes[0])
  }
  
  setViewState(state) {
    return this.applyViewState(this.container.childNodes[0], state)
  }
  
  applyViewState(node, state) {
    this.expandElement(node)
    
    const children = this.getChildren(node);
    children.filter(ea =>
        ea.classList.contains("element"));
      
    state.children.forEach( ea => {
      const child = children.find( c => c.pattern == ea.pattern)
      if (child) this.applyViewState(child, ea) 
      })
    }
  
  
  expandElement(element) {
    if (!element.isExpanded) this.render(element, true);
  }

  collapseElement(element) {
    if (element.isExpanded) this.render(element, false);
  }
  
  captureViewState(node) {
    const result = {
      pattern: node.pattern,
      children: [],
    }
    
    this.getChildren(node)
      .filter(ea => ea.isExpanded)
      .forEach(ea => {
          result.children.push(this.captureViewState(ea))        
        });
    return result;
  }
  
  updatePatterns(node) {
    if (!node.target) {
      node.pattern = "NOTARGET"
    }
   this.getChildren(node).forEach( ea => {
        this.updatePatterns(ea);
   })
  }
  
  
 /*MD # Utils MD*/
  
  getChildren(node){
    if (node.querySelector) {
      const content = node.querySelector("#content")
      if (content) {
        return content.childNodes
      }
    }
    return []
  }
  
/*MD # Lively Integration MD*/
  
  async livelyExample() {
    const url = lively4url + "/src/components/tools/lively-ast-inspector.js";
    const src = await fetch(url).then(r => r.text());
    const ast = src.toAST();
    this.inspect(ast.program);
  }
  
  async livelyMigrate(other) {
    this.inspect(other.targetObject);
    this.setViewState(other.getViewState());
  }
}