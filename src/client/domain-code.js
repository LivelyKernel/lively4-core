/*MD # Domain Code 

[Test](edit://test/domain-code-test.js)

## Related Work

- [tree_sitter_graph](https://docs.rs/tree-sitter-graph/latest/tree_sitter_graph/)

MD*/


import tinycolor from 'src/external/tinycolor.js';

import Strings from "src/client/strings.js"
import {Parser, JavaScript, visit as treeSitterVisit, match, debugPrint} from "src/client/tree-sitter.js"

import {loc} from "utils"


import { ChawatheScriptGenerator} from 'src/client/domain-code/chawathe-script-generator.js';


// from: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};




export class DomainObject {
  
  get replacements() {
    if (this.parent) {
      return this.parent.replacements
    }
    if (!this._replacements) {
      this._replacements = []
    }
    return this._replacements
  }
  
  get livelyCodeMirror() {
    if (this._livelyCodeMirror) return this._livelyCodeMirror
    if (this.parent) return this.parent.livelyCodeMirror
  }
  
  set livelyCodeMirror(editor) {
    this._livelyCodeMirror = editor
  }
  
  
  get logFunc() {
    if (this._logFunc) return this._logFunc
    if (this.parent) return this.parent.logFunc
  }
  
  set logFunc(func) {
    this._logFunc  = func
  }
  
  log(s)  {
    if (this.logFunc) this.logFunc(s)
  }
  
  setLog(logFunc) {
    this._logFunc = logFunc
  }
  
  
  replaceType(type, classObj) {
    this.replacements.push({query: type, class: classObj, instances: []})
    
   this.updateReplacements()
  }
  
  updateReplacements() {
    this.log("updateReplacements")
    for (let replacement of this.replacements) {
      var currentMatches = []
      this.visit(ea => {
        if (ea.type === replacement.query) { 
          currentMatches.push(ea)
        }
      })
      
      let lastMatches = new Map()
      replacement.instances.forEach(ea => lastMatches.set(ea.id, ea))
      
      
      let currentMatchesIds = new Set()
      for (let ea of currentMatches) {
        let instance = lastMatches.get(ea.id)
        if (instance) {
          // (A) do nothing  
        } else {
          // (B) add replacement
          instance = new replacement.class(ea)
          replacement.instances.push(instance)
        }
        instance.install()
        if (this.livelyCodeMirror) {
          instance.renderOn(this.livelyCodeMirror)
        }
        
        currentMatchesIds.add(ea.id)
      }
      
      
      
      
      let toDelete =  replacement.instances.filter(ea => !currentMatchesIds.has(ea.id))
      for (let ea of toDelete) {
        // (C) remove replacement
        ea.remove()
      }
      replacement.instances = replacement.instances.filter(ea => currentMatchesIds.has(ea.id))
      
      
    }
  }

  get isDomainObject() {
    return true
  }
  
  get isTreeSitter() {
    return false
  }
  
  get isReplacement() {
    return false
  }
  
  get depth() {
    if(!this.parent) return 0
    return this.parent.depth + 1
  }
  
  renderAll(codeMirror) {
    this.visit(ea => ea.renderOn(codeMirror))
  }
    
  renderOn(codeMirror) {
    // do nothing
  }
  
  debugPrint() {
    let s = ""
    this.visit(ea => s += Strings.indent(ea.type  + " " + ea.id, ea.depth, "  ") + "\n")
    return s  
  }
  
  visit(func) {
    func(this)
    for(let ea of this.children) {
      ea.visit(func)
    }
  }
  
  rootNode() {``
    if (!this.parent) return this
    return this.parent.rootNode()
  }
  
  // callback after the domain object is removed... e.g. while editing
  remove() {
    // do nothing
  }
  
  static visitTreeSitter(treeSitterNode, func) {
    func(treeSitterNode)
    for(let i=0; i< treeSitterNode.childCount; i++) {
      var child = treeSitterNode.child(i)
      this.visitTreeSitter(child, func)
    }
  }
  
  static adjustIndex(index, edit) {
    
    const delta = edit.newEndIndex - edit.oldEndIndex
    if (index > edit.startIndex) {
      return index + delta
    } else {
      return index
    }
  }
  
  static edit(rootDomainObject, sourceNew, notUsedEdit, debugInfo={} ) {
    
    
    let originalAST = rootDomainObject.treeSitter.tree
    let originalSource = originalAST.rootNode.text
    
    let newAST = TreeSitterDomainObject.astFromSource(sourceNew)
    
    
    if(!originalAST) {throw new Error("originalAST missing")}
    if(!newAST) {throw new Error("originalAST missing")}
    
    if (debugInfo.newAST) debugInfo.newAST(newAST)

    let mappings = match(originalAST.rootNode, newAST.rootNode, 0, 100)
    var scriptGenerator = new ChawatheScriptGenerator()
    scriptGenerator.initWith(originalAST.rootNode, newAST.rootNode, mappings) 
    scriptGenerator.generate()
   
    if (debugInfo.mappings) debugInfo.mappings(mappings)
    if (debugInfo.actions) debugInfo.actions(scriptGenerator.actions)
    
    let newTreeSitterNodeByOldId = new Map()
    for(let mapping of mappings) {
      newTreeSitterNodeByOldId.set(mapping.node1.id, mapping.node2)
    }
    
    let newTreeSitterNodeById = new Map()
    treeSitterVisit(newAST.rootNode, ea => newTreeSitterNodeById.set(ea.id, ea))
    
    
    let obsolteDomainObjects = []
    
    let domainObjectByOldId = new Map() 
    let domainObjectById = new Map() 
    rootDomainObject.visit(domainObject => {
      domainObjectByOldId.set(domainObject.id, domainObject)  
      debugInfo.log && debugInfo.log("initial domainObjectById set " + domainObject.id )
    })
    
    // modify only after traversion
    for(let domainObject of domainObjectByOldId.values()) {
      var newNode = newTreeSitterNodeByOldId.get(domainObject.id)
      if (newNode) {
        domainObject.treeSitter = newNode
        domainObjectById.set(domainObject.id, domainObject)
      } else {
        obsolteDomainObjects.push(domainObject)
      }
    }
    
    
    for(let action of scriptGenerator.actions) {
      action.node.id = parseInt(action.node.id)
      if (action.type === "insert") {
        // can be old or new id
        let parentDomainObject = domainObjectByOldId.get(action.parent.id)
        if (!parentDomainObject) {
          parentDomainObject = domainObjectById.get(action.parent.id)
        }
        
        if (!parentDomainObject) {
          throw new Error(`parent domain object (${action.parent.type} ${action.parent.id}) not found`)
        }
        
        let treeSitter = newTreeSitterNodeById.get(action.node.id)
        var newDomainObject = new TreeSitterDomainObject(treeSitter)
        newDomainObject.children = []
        newDomainObject.parent = parentDomainObject
        
        parentDomainObject.children.splice(action.pos, 0, newDomainObject)
        
        domainObjectById.set(newDomainObject.id, newDomainObject)  
        debugInfo.log && debugInfo.log("domainObjectById set " + newDomainObject.type + " " + newDomainObject.id )
      }
      if (action.type === "delete") {
        // can be old or new id
        let domainObject = domainObjectByOldId.get(action.node.id)
        if (!domainObject) {
          domainObject = domainObjectById.get(action.node.id)
        }
        if (!domainObject) {
          lively.warn("could not find and delete " + action.node.type + " " + action.node.id)
        } else {
          if (!domainObject.parent) {
            lively.warn("could not delete " + action.node.type + " " + action.node.id + " without parent")
            
          } else {
            var index = domainObject.parent.children.indexOf(domainObject)

            domainObject.parent.children.splice(index, 1)

            debugInfo.log && debugInfo.log("delelet " + domainObject.type + " " + domainObject.id )                      
          }
        }
      }
      if (action.type === "update") {
        let domainObject = domainObjectByOldId.get(action.node.id)
        if (!domainObject) {
          domainObject = domainObjectById.get(action.node.id)
        }
        if (!domainObject) {
          debugger
          throw new Error("could not find treeSitter node " + action.node.type + " " + action.node.id)
        }
        
        // we ignore the value change of the update but take the actual other treesitter node that is responsible 
        let otherTreeSitter = newTreeSitterNodeById.get(action.other.id)
        
        if (!otherTreeSitter) {
          throw new Error("Update failed: could not find other treeSitter node again")
        }
        domainObject.treeSitter = otherTreeSitter
        
      }
      if (action.type === "move") {
      
        let domainObject = domainObjectByOldId.get(action.node.id)
        if (!domainObject) {
          domainObject = domainObjectById.get(action.node.id)
        }
        if (!domainObject) {
          throw new Error("Move failed: could not find treeSitter node " + action.node.type + " " + action.node.id)
        }
       
        let parentDomainObject = domainObjectByOldId.get(action.parent.id)
        if (!parentDomainObject) {
          parentDomainObject = domainObjectById.get(action.parent.id)
        }
        
        if (!parentDomainObject) {
          throw new Error(`parent domain object (${action.parent.type} ${action.parent.id}) not found`)
        }
        // lively.notify("insert " + domainObject.type + " " + domainObject.id + " into " + parentDomainObject.type + " " + parentDomainObject.id + " at " + action.pos )
        
        
        // #TODO refactor and add addChild removeChild etc...
        domainObject.parent.children = domainObject.parent.children.filter(ea => ea !== domainObject)
        
        parentDomainObject.children.splice(action.pos, 0, domainObject)
        domainObject.parent = parentDomainObject
        
        if (parentDomainObject.children[action.pos] !== domainObject) {
          throw new Error("moving did not work")
        }
        
      }

      
    }
    
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
    return this._treeSitterHistory && this._treeSitterHistory.last  
  }
  
  get id() {
    return this.treeSitter.id
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
    this.log(this.type + " setText ")
    
    
    var oldRoot = this.rootNode()
    
    var from = loc(this.startPosition).asCM()
    var to = loc(this.endPosition).asCM()
    
    var result = livelyCodeMirror.editor.replaceRange(string, from, to)
    
    // var newTo = livelyCodeMirror.editor.posFromIndex(livelyCodeMirror.editor.indexFromPos(from) + string.length)
    
    let edit = undefined
    
    // let edit = {
    //   startIndex: this.treeSitter.startIndex,
    //   oldEndIndex: this.treeSitter.endIndex,
    //   newEndIndex: this.treeSitter.startIndex + string.length,
    //   startPosition: loc(from).asTreeSitter(),
    //   oldEndPosition: loc(to).asTreeSitter(),
    //   newEndPosition: loc(newTo).asTreeSitter(),
    // }
    
    DomainObject.edit(this.rootNode(), livelyCodeMirror.value)
    
    livelyCodeMirror.dispatchEvent(new CustomEvent("domain-code-changed", {detail: {node: this, edit: edit}}))
    
    this.updateReplacements()
  }
  
  get isTreeSitter() {
    return true
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
  
  static fromTreeSitterAST(ast) {
    let domainObject = new TreeSitterDomainObject(ast)
    
    domainObject.children = []
    for(var i=0; i < ast.childCount; i++) {
      var child = ast.child(i)
      let domainChild =  TreeSitterDomainObject.fromTreeSitterAST(child)
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
    this.install()
  }
  
  install() {
    
    if (this.target && this.target.parent && !this.target.parent.children.includes(this)) {
      this.parent = this.target.parent
      let idx = this.parent.children.indexOf(this.target)
      this.parent.children[idx] = this
    }
  }
  
  
  get isReplacement() {
    return true
  }
  
  get treeSitter() {
    return this.target.treeSitter
  }
  
  set treeSitter(node) {
    this.target.treeSitter = node
  }
  
  
  get children() {
    return this.target ? this.target.children : []
  }
  
  set children(list) {
    this.target.children = list
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

  get id() {
    return this.target.id
  }
  
  get inspectorClassName() {
    if (this.type) {
      return `Replacement(${this.type}) ${this.target._treeSitterHistory.map(ea => ea.id).join(" ")}` 
    } else {
      return undefined
    }
  }
  
  remove() {
    if (this.parent) {
      this.parent.children.splice(this.parent.children.indexOf(this),1, this.target)
      this.parent = null      
    }
    
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
