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
    for(var i=0; i < ast.namedChildCount; i++) {
      var child = ast.namedChild(i)
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
    let from = loc(this.startPosition).asCM()
    
    let to = loc(this.children[0].startPosition).asCM()
    
    
    await livelyCodeMirror.wrapWidget("span", from, to).then(widget => {
          var smiley = <div>😀</div>
          widget.appendChild(smiley);
        });
  } 
  
}



