import { expect } from 'src/external/chai.js';
import { treesitterVisit, parseQuery, DomainObject, TreeSitterDomainObject, LetSmilyReplacementDomainObject,
  ConstSmilyReplacementDomainObject } from 'src/client/domain-code.js';

describe('TreeSitter', () => {

  describe('Parser', () => {
    xit('should reparse and keep ids', async () => {

      let sourceCode = `let a = 3 + 4\nconst b = a`

      var originalAST = TreeSitterDomainObject.parser.parse(sourceCode);
      let firstLetId = originalAST.rootNode.child(0).id
      let firstConstId = originalAST.rootNode.child(1).id

      let edit = {
        startIndex: 14,
        oldEndIndex: 19,
        newEndIndex: 17,
        startPosition: { row: 1, column: 0 },
        oldEndPosition: { row: 1, column: 5 },
        newEndPosition: { row: 1, column: 3 },
      }
      originalAST.edit(edit); // for reparsing

      let newSourceCode = `let a = 3 + 4\let b = a`
      var newAST = TreeSitterDomainObject.parser.parse(newSourceCode, originalAST);

      expect(newAST.rootNode.child(1).child(0).type, "first const became let").to.equal("let")

      expect(newAST.rootNode.child(0).id, "first let in new id equals updated old let id ").to.equal(
        originalAST.rootNode.child(0).id)

      expect(newAST.rootNode.child(0).id, "first let kept id ").to.equal(firstLetId)
      expect(newAST.rootNode.child(1).id, "first const changed id ").to.not.equal(firstConstId)
    })
  })


  describe('edit', () => {

    xit('should update positions after edit in whole tree', async () => {

      let sourceCode = `let a = 3 + 4\nconst b = a\nvar c = b`
      var originalAST = TreeSitterDomainObject.parser.parse(sourceCode);
      let newSourceCode = `let a = 3 + 4\let b = a\nvar c = b`

      let edit = {
        startIndex: 14,
        oldEndIndex: 19,
        newEndIndex: 17,
        startPosition: { row: 1, column: 0 },
        oldEndPosition: { row: 1, column: 5 },
        newEndPosition: { row: 1, column: 3 },

      }
      window.xoriginalAST = originalAST

      var result = originalAST.edit(edit);
      // treesitterVisit(originalAST.rootNode, node => node.edit(edit)) // to update index

      var newAST = TreeSitterDomainObject.parser.parse(newSourceCode, originalAST);


      expect(newAST.rootNode.child(1).child(0).type, "first const became let").to.equal("let")

      expect(newAST.rootNode.child(0).id, "first let in new id equals updated old let id ").to.equal(
        originalAST.rootNode.child(0).id)

      expect(newAST.rootNode.child(0).id, "first let kept id ").to.equal(firstLetId)
      expect(newAST.rootNode.child(1).id, "first const changed id ").to.not.equal(firstConstId)
    })


  })
})

describe('Domain Code', () => {
  let livelyCodeMirror

  before("load", async () => {
    livelyCodeMirror = await (<lively-code-mirror></lively-code-mirror>)
  });

  describe('DomainObject', () => {
    it('reconciles change when adding new statement at start', () => {
      let sourceOriginal = `
a = 3`
      let sourceNew = `l
a = 3`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)
      DomainObject.edit(root, sourceNew, { startIndex: 0, oldEndIndex: 0, newEndIndex: 1 })

      expect(root.children.length).equals(2);
      expect(root.children[1].children[0].type).equals("assignment_expression")
    })

    it('reconciles change when adding new statement at end', () => {
      let sourceOriginal = `a = 3`
      let sourceNew = `a = 3
l`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)
      DomainObject.edit(root, sourceNew, { startIndex: 0, oldEndIndex: 0, newEndIndex: 1 })

      expect(root.children.length).equals(2);
      expect(root.children[0].children[0].type).equals("assignment_expression")
    })

    it('reconciles change when removing statement at end', () => {
      let sourceOriginal = `a = 3
l`
      let sourceNew = `a = 3`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)
      
      
      DomainObject.edit(root, sourceNew, { startIndex: 9, oldEndIndex: 9, newEndIndex: 10 })

      expect(root.children.length).equals(1);
      expect(root.children[0].children[0].type).equals("assignment_expression")
    })

    it('reconciles change when removing statement at start', () => {
      let sourceOriginal = `l
a = 3`
      let sourceNew = `a = 3`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)
      DomainObject.edit(root, sourceNew, { startIndex: 0, oldEndIndex: 0, newEndIndex: 1 })

      expect(root.children.length).equals(1);
      expect(root.children[0].children[0].type).equals("assignment_expression")
    })

    it('reconciles change when adding new statement at start of a function', () => {
      let sourceOriginal = `function() {
  
  let a = 3
}`
      let sourceNew = `function() {
  l
  let a = 3
}`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)
      DomainObject.edit(root, sourceNew, { startIndex: 15, oldEndIndex: 15, newEndIndex: 16 })

      const block = root.children[0].children[0].children[2]
      expect(block.type).equals("statement_block")

      expect(block.children.length).equals(4);
      expect(block.children[2].type).equals("lexical_declaration")
    })

    it('reconciles change when updating ', () => {
      let sourceOriginal = `let a = 3`
      let sourceNew = `const a = 3`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)
      DomainObject.edit(root, sourceNew)

      expect(root.children[0].children[0].type).equals("const")
    })

    it('reconciles change when moving ', () => {
      let sourceOriginal = `let a = 3 + 4`
      let sourceNew = `{let a = 3 + 4}`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)

      let lexicalDeclaration = root.children[0]
      expect(lexicalDeclaration.type, "before").equals("lexical_declaration")

      DomainObject.edit(root, sourceNew)
      

      let sameLexicalDeclaration = root.children[0].children[1]
      expect(sameLexicalDeclaration.type, "after").equals("lexical_declaration")

      expect(lexicalDeclaration, "indentical object").equals(sameLexicalDeclaration)


    })

    
    it('reconciles change when inserting ', () => {
      let sourceOriginal = `let a = 3`
      let sourceNew = `let a = 3\nx`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)

      
      DomainObject.edit(root, sourceNew)
      

      let exressionStatement = root.children[1]
      expect(exressionStatement.type).equals("expression_statement")
      expect(exressionStatement.treeSitter.startIndex).equals(10)
      
     
    })
    
    it('reconciles update the source code', () => {
      let sourceOriginal = `let a = 3`
      let sourceNew = `let a = 3\nx`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)

      expect(root.treeSitter.tree.rootNode.text, "sourceOriginal").equals(sourceOriginal)  
      
      DomainObject.edit(root, sourceNew)
      
      
      expect(root.treeSitter.tree.rootNode.text, "sourceNew").equals(sourceNew)  
    })
    
    it('reconciles change when inserting again', () => {
      let sourceOriginal = `let a = 3`
      let sourceNew = `let a = 3\nx`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)

      DomainObject.edit(root, sourceNew)
      
      
       
      let secondEdit = `let a = 3\nx\n`
      
      expect(root.children.length).equals(2)
      
      
      DomainObject.edit(root, secondEdit, undefined, {actions: editScript => {
        
        expect(editScript.actions.length, "actions").equals(0)  
      }})
      
      expect(root.children.length).equals(2)
    })

    
    
    it('reconciles changes with nothing ', () => {
      let sourceOriginal = `let a = 3`
      let sourceNew = ``
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)

      DomainObject.edit(root, sourceNew)
      
      expect(root.children.length).equals(0)
    })
    
    it('reconciles changes with something complety different ', () => {
      let sourceOriginal = `let a = 3`
      let sourceNew = `var b`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)

      DomainObject.edit(root, sourceNew)
      
      expect(root.children.length).equals(1)
    })
     
    it('reconciles changes after error ', () => {
      let sourceOriginal = `var a =`
      let sourceNew = `var a = 3`
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)

      DomainObject.edit(root, sourceNew)
      
      expect(root.children.length).equals(1)
    })

    describe('adjustIndex', () => {
      it('do nothing to index before edits', async () => {
        var index = 3
        var newIndex = DomainObject.adjustIndex(index, { startIndex: 5, oldEndIndex: 5,
          newEndIndex: 6 })
        expect(newIndex).equals(index)
      })

      it('increases for index after adding edits', async () => {
        var index = 10
        var newIndex = DomainObject.adjustIndex(index, { startIndex: 5, oldEndIndex: 5,
          newEndIndex: 6 })
        expect(newIndex).equals(11)
      })

      it('decreases for index after deleting edits', async () => {
        var index = 10
        var newIndex = DomainObject.adjustIndex(index, { startIndex: 5, oldEndIndex: 5,
          newEndIndex: 4 })
        expect(newIndex).equals(9)
      })
    })
  })

  describe('TreeSitterDomainObject', () => {
    let sourceCode, obj

    function resetDomainObject() {
      sourceCode = `// hello\nlet a = 3`
      livelyCodeMirror.value = sourceCode
      obj = TreeSitterDomainObject.fromSource(sourceCode)
    }

    describe('getText', () => {
      it('gets a let expr', async () => {
        resetDomainObject()
        var letObj = obj.children[1].children[0]
        expect(letObj.type, "type").to.equal("let")
        expect(letObj.getText(livelyCodeMirror), "getText").to.equal("let")

      });
    });
    describe('setText', () => {
      it('sets a const expr and text changes', async () => {
        resetDomainObject()
        var letObj = obj.children[1].children[0]
        letObj.setText(livelyCodeMirror, "const")

        expect(livelyCodeMirror.value).to.match(/const a/)
      });
      it('sets a const expr and domain object becomes const', async () => {
        resetDomainObject()

        var letObj = obj.children[1].children[0]
        var oldIdentifierNode = obj.children[1].children[1].children[0].treeSitter
        expect(oldIdentifierNode.text, "old identifier").to.equal("a")


        letObj.setText(livelyCodeMirror, "const")
        
        // maybe this should go into setText... but then we get problems with cycles/doing things twice...
        DomainObject.edit(obj, livelyCodeMirror.value)
        obj.updateReplacements()
        
        expect(livelyCodeMirror.value, "codemirror is updated").to.match(/const a/)


        var constObj = obj.children[1].children[0]

        expect(constObj.treeSitter.text, "label changed").to.equal("const")

        // lively.openComponentInWindow("lively-ast-treesitter-inspector").then(comp => comp.inspect(letObj.debugNewAST.rootNode))


        //         expect(letObj.debugNewAST.rootNode.child(1).text, "new ast has const").to.equal("const a = 3")
        //         expect(letObj.debugNewAST.rootNode.child(1).child(0).type, "new ast has const").to.equal("const")

        //         var newIdentifierNode = letObj.debugNewAST.rootNode.child(1).child(1).child(0)
        //         expect(newIdentifierNode.text, "new identifier").to.equal("a")
        //         expect(newIdentifierNode.id, "identifier keeps same").to.equal(oldIdentifierNode.id)


        //         var constObj = obj.children[1].children[0]
        //         expect(constObj.type, "old AST changed type ").to.equal("const")

        // #TODO continue here... we need Franken-ASTs ... 
        // Goals:
        // (1) reuse as much old TreeSitterDomainObjects and only create new ones that are acutally needed
        // (2) have a consistent new TreeSitter AST behind
        // (2a) OPTIONAL: start with the frankstein chenanigans on the tree-sitter level an mix and match there
      });
    });
  });


  describe('updateReplacements', () => {
    it('installs new replacement', () => {
      var sourceCode = `let a = 3 + 4; const b = a`
      livelyCodeMirror.value = sourceCode

      let domainObject = TreeSitterDomainObject.fromSource(sourceCode) 
      domainObject.replacements.push({query: 'let', class: LetSmilyReplacementDomainObject, instances: []})
      domainObject.updateReplacements()
      
      expect(domainObject.replacements[0].instances.length, "instances length").equals(1)
      
      var letReplacement = domainObject.children[0].children[0]
      expect(letReplacement.isReplacement, "isReplacement").equals(true)
      expect(letReplacement.type).to.equal("let")
    })
    
    
    it('installs two replacements', () => {
      var sourceCode = `let a = 3 + 4; const b = a`
      livelyCodeMirror.value = sourceCode

      let domainObject = TreeSitterDomainObject.fromSource(sourceCode) 
      domainObject.replaceType('let', LetSmilyReplacementDomainObject)
      domainObject.replaceType('const', LetSmilyReplacementDomainObject)
      
 
      expect(domainObject.replacements.length, "replacements length").equals(2)
 
      expect(domainObject.replacements[0].instances.length, "instances length").equals(1)
      
      var letReplacement = domainObject.children[0].children[0]
      expect(letReplacement.isReplacement, "isReplacement").equals(true)
      expect(letReplacement.type).to.equal("let")
    })
    
  })
  
  
  
  describe('query', () => {
    it('parses an empty query', () => {
      expect(parseQuery('()')).to.eql({ parensType: '(', children: [] })
    });

    it('parses a number', () => {
      expect(parseQuery('43')).to.eql({ content: '43' })
    });

    it('parses a number in a form', () => {
      expect(parseQuery('(43)')).to.eql({ parensType: '(', children: [{ content: '43' }] })
    });

    it('parses two children in a form', () => {
      expect(parseQuery('(43 42)')).to.eql({ parensType: '(', children: [{ content: '43' },
        { content: '42' }
        ] })
    });

    it('parses a nested form', () => {
      expect(parseQuery('(32 (43) @ab)')).to.eql({
        parensType: '(',
        children: [
          { content: '32' },
          { parensType: '(', children: [{ content: '43' }] },
          { content: '@ab' },
        ]
      })
    });

    xit('parses let query', () => {
      expect(parseQuery('(lexical_declaration ["let" "const"] @myKind) @root')).to.eql({
        parensType: '(',
        children: [
          { content: '32' },
          { parensType: '(', children: [{ content: '43' }] },
          { content: '@ab' },
        ]
      })
    });
  });

  describe('SmilyReplacementDomainObject', () => {

    it('click on let replacement works MANUAL', () => {

      var sourceCode =
        `// hello
let a = 3 + 4 
const b = a`
      livelyCodeMirror.value = sourceCode

      let domainObject = TreeSitterDomainObject.fromSource(sourceCode)
      domainObject.replaceType('let', LetSmilyReplacementDomainObject)
      domainObject.replaceType('const', ConstSmilyReplacementDomainObject)

      expect(domainObject.children.length, "childrens").to.equal(3)

      var letReplacement = domainObject.children[1].children[0]
      expect(letReplacement.isReplacement, "isReplacement").equals(true)
      expect(letReplacement.type).to.equal("let")

      // letReplacement.target.setText(livelyCodeMirror, "const")

      // MANUAL
      livelyCodeMirror.value = `// hello
const a = 3 + 4 
const b = a`
      DomainObject.edit(domainObject, livelyCodeMirror.value)
      domainObject.updateReplacements()

      expect(livelyCodeMirror.value).to.match(/const a/)
      expect(domainObject.treeSitter.childCount, "childCount after replacement").to.equal(3)
      expect(domainObject.children.length, "children after replacement").to.equal(3)

      var newConsDomainObject = domainObject.children[1].children[0]
      expect(newConsDomainObject.type, "newConst").to.equal("const")
    });

    it('click on let replacement works via setText', () => {

      var sourceCode =
        `// hello
let a = 3 + 4 
const b = a`
      livelyCodeMirror.value = sourceCode

      let domainObject = TreeSitterDomainObject.fromSource(sourceCode)
      domainObject.replaceType('let', LetSmilyReplacementDomainObject)
      domainObject.replaceType('const', ConstSmilyReplacementDomainObject)

      expect(domainObject.children.length, "childrens").to.equal(3)

      var letReplacement = domainObject.children[1].children[0]
      expect(letReplacement.isReplacement).to.be.true
      expect(letReplacement.type).to.equal("let")

      letReplacement.target.setText(livelyCodeMirror, "const")
      
      // maybe this should go into setText... but then we get problems with cycles/doing things twice...
      DomainObject.edit(domainObject, livelyCodeMirror.value)
      domainObject.updateReplacements()

      expect(livelyCodeMirror.value).to.equal(`// hello
const a = 3 + 4 
const b = a`)


      expect(livelyCodeMirror.value).to.match(/const a/)
      expect(domainObject.treeSitter.childCount, "childCount after replacement").to.equal(3)
      expect(domainObject.children.length, "children after replacement").to.equal(3)

      var newConsDomainObject = domainObject.children[1].children[0]
      expect(newConsDomainObject.type, "newConst").to.equal("const")
    });


    // #WIP continue here #KnownToFail
    xit('click on const and then on let replacement', () => {
      var sourceCode =
        `// hello
let a = 3 + 4 
const b = a`
      livelyCodeMirror.value = sourceCode

      let domainObject = TreeSitterDomainObject.fromSource(sourceCode)
      domainObject.replaceType('let', LetSmilyReplacementDomainObject)
      domainObject.replaceType('const', ConstSmilyReplacementDomainObject)


      var constReplacement = domainObject.children[2].children[0]

      constReplacement.target.setText(livelyCodeMirror, "let")

      expect(livelyCodeMirror.value).to.match(/let b/)
      expect(domainObject.treeSitter.childCount, "childCount after replacement").to.equal(3)
      expect(domainObject.children.length, "children after replacement").to.equal(3)

      var newLetDomainObject = domainObject.children[2].children[0]
      expect(newLetDomainObject.type, "newLet").to.equal("let")


      var letReplacement = domainObject.children[1].children[0]
      expect(letReplacement.isReplacement, "let isReplacement").to.be.true
      expect(letReplacement.type).to.equal("let")

      letReplacement.target.setText(livelyCodeMirror, "const")

    });

    it('click on let and then on const replacement', () => {
      var sourceCode =
        `// hello
let a = 3 + 4 
const b = a`
      livelyCodeMirror.value = sourceCode

      let domainObject = TreeSitterDomainObject.fromSource(sourceCode)
      domainObject.livelyCodeMirror = livelyCodeMirror
      domainObject.replaceType('let', LetSmilyReplacementDomainObject)
      domainObject.replaceType('const', ConstSmilyReplacementDomainObject)

      // expect(domainObject.children[0].children[0].type).equals("let")
      
      
      var letReplacement = domainObject.children[1].children[0]
      letReplacement.livelyCodeMirror = livelyCodeMirror
      expect(letReplacement.isReplacement, "let isReplacement").to.be.true
      
      
      letReplacement.onClick()
      
      // TODO this should be called by the editor
      DomainObject.edit(domainObject, livelyCodeMirror.value)
      domainObject.updateReplacements()
      
      
      
      var constReplacement = domainObject.children[2].children[0]
      constReplacement.livelyCodeMirror = livelyCodeMirror      
      expect(constReplacement.isReplacement, "const isReplacement").to.be.true
      
      
      constReplacement.onClick()
      // TODO this should be called by the editor
      DomainObject.edit(domainObject, livelyCodeMirror.value)
      domainObject.updateReplacements()
      
      
      expect(livelyCodeMirror.value).to.match(/let b/)
      expect(domainObject.treeSitter.childCount, "childCount after replacement").to.equal(3)
      expect(domainObject.children.length, "children after replacement").to.equal(3)

      var newLetDomainObject = domainObject.children[2].children[0]
      expect(newLetDomainObject.type, "newLet").to.equal("let")
    });
  })
});
