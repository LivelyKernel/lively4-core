import AstInspector from "./lively-ast-inspector.js"

await lively.loadJavaScriptThroughDOM("treeSitter", lively4url + "/src/external/tree-sitter/tree-sitter.js")

const Parser = window.TreeSitter;
await Parser.init()

const JavaScript = await Parser.Language.load(lively4url + "/src/external/tree-sitter/tree-sitter-javascript.wasm");


import LivelyCodeMirrorCodeProvider from 'src/components/widgets/lively-code-mirror-code-provider.js';

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

    // const fields = t.NODE_FIELDS[node.type];
    // const visitorKeys = t.VISITOR_KEYS[node.type];
    allKeys.forEach(key => {
      classifications[key] = new Set();
      // if (this.isLocationKey(key)) return classifications[key].add("location");
      // if (this.isTypeKey(key)) return classifications[key].add("type");
      if (this.isChildKey(key)) {
        classifications[key].add("child");
      } else {
        classifications[key].add("field");    
      }
      
    });
    return classifications;
  }
  
  renderTreeSitterNode(element, expanded) {
    const target = element.target;
    if (target.childCount > 0) {
      element.append(this.expansionIndicatorTemplate(element.isExpanded));
    }
    
    element.append(this.keyTemplate(element));
    element.append(this.labelTemplate(target.type));
    element.append(<span style="font-size:6pt;padding:0px 2px 0px 2px;margin:0px; border-radius:3px; background:lightgray; color:white">{target.id}</span>);
    element.append(<span style="font-size:6pt;padding:0px;margin:0px"> {target.startIndex}-{target.endIndex} </span>);
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
  

  // #TODO walker do not seem to work, so do it recursively! @Tom I need help! (@JensLincke)
  treesitterTraverse(node, visit) {
    visit(node)
    for(let i=0; i < node.childCount; i++) {
      this.treesitterTraverse(node.child(i), visit)
    }
  }
  
  treesitterFindParent(node, isValid) {
    if (!node) return
    if (isValid(node)) return node
    this.treesitterFindParent(node.parent, isValid)
  }
  
 
  // #Copied from ast-capabilities.js
  getFirstSelectionOrCursorPosition() {
    
    if (this.codeProvider.selections.length == 0) {
      return { anchor: this.codeProvider.cursor, head: this.codeProvider.cursor };
    }
    return this.codeProvider.selections[0];
  }
  
  
  // Source selection -> AST selection 
  connectLivelyCodeMirror(lcm) {
    
    this.codeProvider = new LivelyCodeMirrorCodeProvider(lcm, lcm.editor);
    
    // override default AstCapabilities
    // #TODO we need src/components/widgets/ast-capabilities.js for TreeSitter
        
    lcm.currentInspector = this
    lcm.editor.on("cursorActivity", (cm) => {
      if (lcm.currentInspector !== this) return // TODO... unregister events when developing?
    
      var nodesContainingSelection = []
      
      var selection = range(this.getFirstSelectionOrCursorPosition())
      
      this.treesitterTraverse(this.targetObject, node => {
        
        if(range([node.startPosition, node.endPosition]).containsRange(selection)) {
          nodesContainingSelection.push(node)
        }
      })

      this.selectNode(nodesContainingSelection.last) 
    })
  }
  
  selectNode(lastNode) {  
    let nodePath = []

    this.treesitterFindParent(lastNode, node => {
      nodePath.push(node)
      return false
    })

    nodePath = nodePath.reverse()
    this.selectNodePath(nodePath);
  }


  selectNodePath(nodePath) {
    if (this.selection) {
      this.selection.classList.remove("selected");
    }
    
    let element
    for (let node of nodePath) {
      // this is ugly but it works.... 
      element = Array.from(this.shadowRoot.querySelectorAll(".element")).find(ea => ea.target.id == node.id)
      if (element) {
        this.expandElement(element);
      }
    }
    if (element) {
      this.scrollIntoView(element);

      this.selection = element;
      this.selection.classList.add("selected");
    }
  }
  
  
  // AST selection -> Source selection
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
      return element.child(key)
    } else {
      return element.childForFieldName(key)
    }
    // return element[key]
  }
  
  allKeys(obj) {
    if (this.isTreeSitterNode(obj)) {
      var result = []
      for(let i=0; i < obj.childCount; i++) {
        let child = obj.child(i) 
        let name = obj.fieldNameForChild(i)
        // if (child.isNamed()) {
          let key
          if (name) {
            if (result.includes(name)) {
              key = i
            } else {
              key = name
            }
          } else {
            key = i
          }
          result.push(key)
        // }
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