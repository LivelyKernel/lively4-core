/*MD # Domain Code 

[Test](edit://test/domain-code-test.js)

## Related Work

- [tree_sitter_graph](https://docs.rs/tree-sitter-graph/latest/tree_sitter_graph/)

MD*/


import tinycolor from 'src/external/tinycolor.js';


// #Copy from /src/components/tools/lively-ast-treesitter-inspector.js
// #TODO extract... ?
await lively.loadJavaScriptThroughDOM("treeSitter", lively4url + "/src/external/tree-sitter/tree-sitter.js")
const Parser = window.TreeSitter;
await Parser.init()
const JavaScript = await Parser.Language.load(lively4url + "/src/external/tree-sitter/tree-sitter-javascript.wasm");


import {loc} from "utils"

export class DomainObject {
  
  replaceType(type, classObj) {
    this.visit(ea => {
      if (ea.type === type) {
        // in sandblocks this would be the rootBinding
        new classObj(ea)
      }
    })
  }
  
  get isDomainObject() {
    return true
  }
  
  get isReplacement() {
    return false
  }
  
  renderAll(codeMirror) {
    this.visit(ea => ea.renderOn(codeMirror))
  }
    
  renderOn(codeMirror) {
    // do nothing
  }
  
  visit(func) {
    func(this)
    for(let ea of this.children) {
      ea.visit(func)
    }
  }
  
  rootNode() {
    if (!this.parent) return this
    return this.parent.rootNode()
  }
  
  // callback after the domain object is removed... e.g. while editing
  removed() {
    // do nothing
  }
  
  static visitTreeSitter(treeSitterNode, func) {
    func(treeSitterNode)
    for(let i=0; i< treeSitterNode.childCount; i++) {
      var child = treeSitterNode.child(i)
      this.visitTreeSitter(child, func)
    }
  }
  /*MD ### Update from TreeSitter
  
- (A) we could walk the domain objects and patch in the TreeSitter nodes 
  - we would keep the replacements....
  - but risc chaos in the tree structure
- (B) we could walk the tree sitter nodes and patch in the domain objects...
  - straigt forward but we would loose all the replacements

**Strategy**: write tests and then go either way and see if we arrive there...

  MD*/
  static updateFromTreeSitter(rootNode, treeSitterNode) {
        
    let usedDomainObjects = new Set()
    let removedDomainObjects = new Set()
    let addedDomainObjects = new Set()
    
    let domainObjectsById = new Map()
    let replacementsForDomainObject = new Map()
    
    rootNode.visit(eaNode => {
      if (eaNode.treeSitter) {
        domainObjectsById.set(eaNode.treeSitter.id, eaNode)
      } else {
        domainObjectsById.set(eaNode.target.treeSitter.id, eaNode.target)
        replacementsForDomainObject.set(eaNode.target, eaNode )
      }
    })
    
    
    var newRootNode = TreeSitterDomainObject.fromTreeSitterAST(treeSitterNode, domainObjectsById, usedDomainObjects)
        
    for(let replacement of replacementsForDomainObject.values()) {
      
      if(usedDomainObjects.has(replacement.target)) {
        // reinstall it...
        let domainObject = replacement.target
        var idx = domainObject.parent.children.indexOf(domainObject)
        domainObject.parent.children[idx] = replacement
        replacement.parent = domainObject.parent
        replacement.target = domainObject  
        usedDomainObjects.add(replacement)
      } else {
        removedDomainObjects.add(replacement)
        
      }
    }
    for(let removedDomainObject of removedDomainObjects) {
      removedDomainObject.removed()
    }
    
    
    // keep same rootNode, alternative would be have another outside object that keeps the reference
    rootNode.treeSitter = newRootNode.treeSitter
    rootNode.children = newRootNode.children
  }

  printStructure() {
    return "(" + this.type + this.children
  }
  
  
}
/*MD # TreeSitterDomainObjectMD*/
/*MD ## MD*/
export class TreeSitterDomainObject extends DomainObject {
  
  
  constructor(obj) {
    super()
    this.treeSitter = obj
    this.children = []
  }

  // we need history support for debugging
  set treeSitter(obj) {
    if (!this._treeSitterHistory) this._treeSitterHistory = []
    if (this._treeSitterHistory.last !== obj) {
      this._treeSitterHistory.push(obj)
    }
  }
  
  get treeSitter() {
    return this._treeSitterHistory.last  
  }
  
  get type() {
    return this.treeSitter && this.treeSitter.type
  }
  
  get inspectorClassName() {
    if (this.treeSitter) {
      return `DomainObject(${this.treeSitter.type}) ${this._treeSitterHistory.map(ea => ea.id).join(" ")}` 
    } else {
      return undefined
    }
  }
  
  
  getText(livelyCodeMirror) {
    var from = loc(this.startPosition).asCM()
    var to = loc(this.endPosition).asCM()
    return livelyCodeMirror.editor.getRange(from,to)
  }
  
  
  /*MD ### setText MD*/
  setText(livelyCodeMirror, string) {
    var oldRoot = this.rootNode()
    
    var from = loc(this.startPosition).asCM()
    var to = loc(this.endPosition).asCM()
    var result = livelyCodeMirror.editor.replaceRange(string, from, to)
    var newTo = livelyCodeMirror.editor.posFromIndex(livelyCodeMirror.editor.indexFromPos(from) + string.length)
    let edit = {
      startIndex: this.treeSitter.startIndex,
      oldEndIndex: this.treeSitter.endIndex,
      newEndIndex: this.treeSitter.startIndex + string.length,
      startPosition: loc(from).asTreeSitter(),
      oldEndPosition: loc(to).asTreeSitter(),
      newEndPosition: loc(newTo).asTreeSitter(),
    }
    // lively.openInspector(edit)
    
    
    this.treeSitter.tree.edit(edit);
    
    
    var newAST = TreeSitterDomainObject.parser.parse(livelyCodeMirror.value, this.treeSitter.tree);
    this.debugNewAST = newAST 
   
    DomainObject.updateFromTreeSitter(this.rootNode(), newAST.rootNode)
    
    
    livelyCodeMirror.dispatchEvent(new CustomEvent("domain-code-changed", {detail: {node: this, edit: edit}}))
  }
  

  
  get startPosition() {
    return this.treeSitter.startPosition
  }

  get endPosition() {
    return this.treeSitter.endPosition
  }
  
  livelyInspect(contentNode, inspector) {
    inspector.renderObjectdProperties(contentNode, this)
    contentNode
  }
  
  static get parser() {
    if (!this._parser) {
      this._parser = new Parser;
      this._parser.setLanguage(JavaScript);
    }
    return this._parser
  }
  
  
  static astFromSource(sourceCode) {
    return this.parser.parse(sourceCode);
  }
  
  static fromSource(sourceCode) {
    var ast = this.astFromSource(sourceCode) 
    return this.fromTreeSitterAST(ast.rootNode)
  }
  
  static fromTreeSitterAST(ast, optionalDomainObjectsById, optionalUsedDomainObjects) {
    let domainObject
    
    if (optionalDomainObjectsById) {
      domainObject = optionalDomainObjectsById.get(ast.id)

      if (domainObject) {
        domainObject.treeSitter = ast
        if (optionalUsedDomainObjects) optionalUsedDomainObjects.add(domainObject)
      }
    } 
    if (!domainObject) {
      domainObject = new TreeSitterDomainObject(ast)
      domainObject.children = []
    }
    for(var i=0; i < ast.childCount; i++) {
      var child = ast.child(i)
      let domainChild =  TreeSitterDomainObject.fromTreeSitterAST(child, optionalDomainObjectsById, optionalUsedDomainObjects)
      domainChild.parent = domainObject
      domainObject.children.push(domainChild)
    }
  
    return domainObject
  }
}

export class ReplacementDomainObject extends DomainObject {
  
  constructor(target) {
    super()
    this.target = target
    
    if (this.target && this.target.parent) {
      this.parent = this.target.parent
      let idx = this.parent.children.indexOf(this.target)
      this.parent.children[idx] = this
    }
  }
  
  get isReplacement() {
    return true
  }
  
  get children() {
    return this.target ? this.target.children : []
  }
  
  get type() {
    return this.target && this.target.type
  }
  
  get startPosition() {
    return this.target && this.target.startPosition
  }

  get endPosition() {
    return this.target && this.target.endPosition
  }

  
  
  get inspectorClassName() {
    if (this.type) {
      return `Replacement(${this.type}) ${this.target._treeSitterHistory.map(ea => ea.id).join(" ")}` 
    } else {
      return undefined
    }
  }
  
  removed() {
    // do nothing
    if (this.widget) this.widget.marker.clear()
  }

  
  codeMirrorMark(cm, from, to, colorName) {    
    let color = tinycolor(colorName)
    color.setAlpha(0.4)

    var fromPos = loc(from).asCM()
    var toPos = loc(to).asCM()
    var marker = cm.markText(fromPos, toPos, 
      {
        className: "domain-code-annotation",
        css: `background-color: ${color.toString()}`});
    return marker
  }
  
  renderOn(codeMirror) {
    // do nothing
    
    
  } 
}

export class SmilyReplacementDomainObject extends ReplacementDomainObject {
  
  
  get bindings() {
    // mock our query infrastructure 
    // #TODO use real queries....
    return {
      rootNode: this
    }
  }
  
  smileContent() {
    return "XXX"
  }
  
  async renderOn(livelyCodeMirror) {
    if (this.livelyCodeMirror  && this.widget) {
      this.widget.marker.clear()
    }
    
    this.livelyCodeMirror = livelyCodeMirror
    // this.codeMirrorMark(livelyCodeMirror.editor, this.startPosition, this.endPosition, "yellow")    
    
    // #TODO getBinding("myKind")
    // if query is: (lexical_declaration ["let" "const"] @myKind) @root
    // alternatively, via local query: this.query('["let" "const"] @root')
    let kindNode = this.bindings.rootNode
    
    let from = loc(kindNode.startPosition).asCM()
    let to = loc(kindNode.endPosition).asCM()
    
    await livelyCodeMirror.wrapWidget("span", from, to).then(widget => {
          this.widget = widget
      
          var smiley = <div click={evt => this.onClick(evt) }>{this.smileContent()}</div>
          widget.appendChild(smiley);
        });
  } 
  
  
  onClick(evt) {
    lively.notify("click on " + this.type)  
  }
  
}

export class LetSmilyReplacementDomainObject extends SmilyReplacementDomainObject {
  smileContent() {
    return "😀"
  }

  onClick(evt) {
    lively.notify("click " + this.target.type + " " + this.target.treeSitter.id)
    this.target.setText(this.livelyCodeMirror, "const")
  }


}

export class ConstSmilyReplacementDomainObject extends SmilyReplacementDomainObject {
  
  smileContent() {
    return "😇"
  }
  
  onClick(evt) {
    lively.notify("click " + this.target.type + " " + this.target.treeSitter.id)
    this.target.setText(this.livelyCodeMirror, "let")
  }
  
}

/*MD 
# Tom's 5min SExpr Parser



An alternative would have been to use existing parser, but then we would not have support for our custom syntax


MD*/

function Stream(s) {
  this.s = s
  this.index = 0
  this.next = function() {
    return this.s[this.index++]
  }
  this.peek = function() {
    return this.s[this.index]
  }
  this.skipWhitespace = function() {
    while (this.peek().match(/\s/)) this.next()
  }
  this.atEnd = function() {
    return this.index >= this.s.length;
  }
}

export function parseQuery(string) {
  return parseSExpr(new Stream(string))
}
function parseSExpr(s) {
  if (['(', '[', '{'].includes(s.peek())) {
    const parensType = s.next()
    const node = { parensType, children: [] }
    while (s.peek() != ')') {
      s.skipWhitespace()
      node.children.push(parseSExpr(s))
      s.skipWhitespace()
    }
    s.next()
    return node
  } else {
    var content = ""
    while (!s.atEnd() && !'() []{}'.includes(s.peek())) content += s.next()
    return { content }
  }
}
