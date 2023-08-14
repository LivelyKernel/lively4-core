/*MD # Domain Code 

## Related Work

- [tree_sitter_graph](https://docs.rs/tree-sitter-graph/latest/tree_sitter_graph/)

MD*/


import tinycolor from 'src/external/tinycolor.js';

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
}


export class TreeSitterDomainObject extends DomainObject {
  
  
  constructor(obj) {
    super()
    this.treeSitter = obj
    this.children = []
  }

  get type() {
    return this.treeSitter && this.treeSitter.type
  }
  
  get inspectorClassName() {
    if (this.treeSitter) {
      return `DomainObject(${this.treeSitter.type})` 
    } else {
      return undefined
    }
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
  
  static fromTreeSitterAST(ast) {
    var obj = new TreeSitterDomainObject(ast)
    obj.children = []
    for(var i=0; i < ast.childCount; i++) {
      var child = ast.child(i)
      let domainChild =  TreeSitterDomainObject.fromTreeSitterAST(child)
      domainChild.parent = obj
      obj.children.push(domainChild)
    }
    
    return obj
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
      return `Replacement(${this.type})` 
    } else {
      return undefined
    }
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

export class LetSmilyReplacementDomainObject extends ReplacementDomainObject {
  
  
  async renderOn(livelyCodeMirror) {
    // this.codeMirrorMark(livelyCodeMirror.editor, this.startPosition, this.endPosition, "yellow")    
    
    // #TODO getBinding("myKind")
    // if query is: (lexical_declaration ["let" "const"] @myKind) @root
    // alternatively, via local query: this.query('["let" "const"] @root')
    let kindBinding = this.children[0]
    
    let from = loc(kindBinding.startPosition).asCM()
    let to = loc(kindBinding.endPosition).asCM()
    
    await livelyCodeMirror.wrapWidget("span", from, to).then(widget => {
          var smiley = <div click={evt => this.onClick(evt) }>😀</div>
          widget.appendChild(smiley);
        });
  } 
  
  
  onClick(evt) {
    lively.notify("click on " + this.type)
  }
  
}

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
