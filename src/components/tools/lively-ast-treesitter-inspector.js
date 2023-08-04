import AstInspector from "./lively-ast-inspector.js"

await lively.loadJavaScriptThroughDOM("treeSitter", lively4url + "/src/external/tree-sitter/tree-sitter.js")

const Parser = window.TreeSitter;
await Parser.init()

const JavaScript = await Parser.Language.load(lively4url + "/src/external/tree-sitter/tree-sitter-javascript.wasm");


import { loc, range } from 'src/client/utils.js';

export default class AstTreesitterInspector extends AstInspector {
 
  async treeSitterParse(sourceCode) {
    const parser = new Parser;

    parser.setLanguage(JavaScript);

    
    const tree = parser.parse(sourceCode);

    return tree
  }
  
  
  isTreeSitterNode(obj) {
    return obj && obj.tree && obj.id && obj.constructor.name == "Node"
  }
  
  treeSitterNodeSummary(astNode, isExpanded) {
    // if (t.isIdentifier(astNode)) {
    //   return `"${astNode.name}"`;
    // } else if (t.isStringLiteral(astNode)) {
    //   return `"${astNode.value}"`;
    // } else if (t.isFunction(astNode)) {
    //   let name = String.fromCodePoint(119891);
    //   if (!astNode.computed && astNode.key) {
    //     name = astNode.key.name || astNode.key.value;
    //   }
    //   let params = "";
    //   if (astNode.params) params = astNode.params.map(param => param.name || "?").join(',');
    //   let modifiers = "";
    //   if (astNode.async) modifiers += "async ";
    //   if (astNode.static) modifiers += "static ";
    //   return `${modifiers} ${name}(${params})`
    // } else if (t.isClassDeclaration(astNode)) {
    //   return `${astNode.id.name}`;
    // } else if (t.isVariableDeclaration(astNode)) {
    //   let variables = astNode.declarations
    //                   .map(decl => (decl.id && decl.id.name) || "?")
    //                   .join(', ');
    //   return `${astNode.kind} [${variables}]`;
    // } else {
      if (astNode.id) return astNode.id.name;
      if (astNode.key) {
        return astNode.key.value || astNode.key.name;
      }
    //}
    return null;
  }
  
 
  
  
  treeSitterNodeKeyClassifications(node) {
    const classifications = {};
    const allKeys = this.allKeys(node);
    debugger
    // const fields = t.NODE_FIELDS[node.type];
    // const visitorKeys = t.VISITOR_KEYS[node.type];
    allKeys.forEach(key => {
      classifications[key] = new Set();
      // if (this.isLocationKey(key)) return classifications[key].add("location");
      // if (this.isTypeKey(key)) return classifications[key].add("type");
      if (this.isChildKey(key)) {
        classifications[key].add("child");
      } else {
        const value = node[key];
        // if (typeof value === "function") classifications[key].add("function");
        // if (visitorKeys && visitorKeys.includes(key)) classifications[key].add("visited");

        // const field = fields && fields[key];
        // if (field) {
        //   if (field.optional) classifications[key].add("optional");
        //   if (field.default === value) classifications[key].add("default");
        //   return;
        // }

        classifications[key].add("unknown");        
      }
      
    });
    return classifications;
  }
  
  renderTreeSitterNode(element, expanded) {
    const target = element.target;
    if (target.namedChildCount > 0) {
      element.append(this.expansionIndicatorTemplate(element.isExpanded));
    }
    
    element.append(this.keyTemplate(element));
    element.append(this.labelTemplate(target.type));
    element.append(<button class="inspect" style="font-size:6pt;padding:0px;margin:0px"
                     click={(evt) => lively.openInspector(element.target)}>inspect</button>);
    const summary = this.treeSitterNodeSummary(element.target, element.isExpanded);
    if (summary) element.append(this.summaryTemplate(summary));
    this.attachHandlers(element);
    if (element.isExpanded) {
      const content = this.contentTemplate();
      const classifications = this.treeSitterNodeKeyClassifications(target);
      for (const key in classifications) {
        const classification = classifications[key];
        if (this.isVisibleAstNodeKey(classification)) {
          content.append(this.display(this.getKey(target, key), 
                                      this.isFoldable(key), key, { classification }))
        }
      }
      element.append(content);
    }
  }
  
  /*MD ## Editor UX MD*/
  onStartHover(element) {  
    if (this.editor && element.target.startPosition) {
      if (this.hoverMarker) this.hoverMarker.clear();
      const cm = this.editor.currentEditor();
      const start = loc(element.target.startPosition);
      const end = loc(element.target.endPosition);
      this.hoverMarker = cm.markText(start.asCM(), end.asCM(), {css: "background-color: #fe3"});
    }
  }
  
  onStopHover(element) {
    if (this.editor && element.target.startPosition) {
      if (this.hoverMarker) this.hoverMarker.clear();
      this.hoverMarker = null;
    }
  }
  
  
  // (A) handle children via key
  isChildKey(key) {
    return Number.isInteger(key)  || key.match(/^[0-9]+$/)
  }
  
  getKey(element, key) {
    if (this.isChildKey(key)) {
      return element.namedChild(key)
    }
    return element[key]
  }
  
  allKeys(obj) {
    if (this.isTreeSitterNode(obj)) {
      var result = []
      for(let i=0; i < obj.namedChildCount; i++) {
        result.push(i)
      }
      return result
    }
    return super.allKeys(obj)
    
  }
  
  
  
  
  // getChildren(node) {
  //   var children = super.getChildren(node)
  //   if(this.isTreeSitterNode(node)) {
  //     for(let i=0; i < node.childCount; i++) {
  //       children.push(node.child(i))
  //     }
  //   }
  //   return children
  // }

  getElementType(obj) {
    if (this.isTreeSitterNode(obj)) return "TreeSitterNode";
    return super.getElementType(obj)
  }
 
  async initialize() {
    await super.initialize()
    this.windowTitle = "AST TreeSitter Inspector";
    if (this.editor) {
      this.connectEditor(this.editor)
    }
  }  
  
  
  livelyMigrate(other) {
    super.livelyMigrate(other)
    this.editor = other.editor
  }
  
  
  async livelyExample() {
    // const url = lively4url + "/src/components/tools/lively-ast-inspector.js";
    // const src = await fetch(url).then(r => r.text());
    
    const sourceCode = 'let x = 1; console.log(x);';
    var tree = await this.treeSitterParse(sourceCode)
    const rootNode = tree.rootNode;
    this.inspect(rootNode);
  }

}