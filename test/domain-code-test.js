// #Clipboard #Test

import {expect} from 'src/external/chai.js';
import {parseQuery, DomainObject, TreeSitterDomainObject, LetSmilyReplacementDomainObject, ConstSmilyReplacementDomainObject} from 'src/client/domain-code.js';

  describe('Domain Code', () => {
    let livelyCodeMirror
    
    before("load", async () => {
      livelyCodeMirror = await (<lively-code-mirror></lively-code-mirror>)
    });
    
    describe('DomainObject', () => {
      describe('updateFromTreeSitter', () => {
        it('should update let to const', async () => {
       
          let sourceCode = `let a = 3 + 4\nconsole.log("x")`      
          let domainObject = TreeSitterDomainObject.fromSource(sourceCode)

          let newSourceCode = `const a = 3 + 4\nconsole.log("x")`      
          let edit = {
            startIndex: 0,
            oldEndIndex: 3,
            newEndIndex: 5,
            startPosition: {row: 0, column: 0},
            oldEndPosition: {row: 0, column: 3},
            newEndPosition: {row: 0, column: 5},
          }
          domainObject.treeSitter.tree.edit(edit);

          var newAST = TreeSitterDomainObject.parser.parse(newSourceCode, domainObject.treeSitter.tree);

          DomainObject.updateFromTreeSitter(domainObject, newAST.rootNode)
          expect(domainObject.children[0].children[0].type, "type").to.equal("const")
        })
        
        
        it('should update let to const and work with replacements', async () => {
       
          let sourceCode = `let a = 3 + 4\nlet a = b\nconsole.log("x")`      
          let domainObject = TreeSitterDomainObject.fromSource(sourceCode)

          expect(domainObject.children.length, "original children size").to.equal(3)
          
          domainObject.replaceType('let', LetSmilyReplacementDomainObject)
          
          // lively.openInspector(domainObject)
          
           
          expect(domainObject.children[0].children[0].target, "origial 1nd let is replacement").not.to.be.undefined;
          expect(domainObject.children[1].children[0].target, "origial 2nd let is replacement").not.to.be.undefined;
          
          let newSourceCode = `const a = 3 + 4\nlet a = b\nconsole.log("x")`      
          let edit = {
            startIndex: 0,
            oldEndIndex: 3,
            newEndIndex: 5,
            startPosition: {row: 0, column: 0},
            oldEndPosition: {row: 0, column: 3},
            newEndPosition: {row: 0, column: 5},
          }
          domainObject.treeSitter.tree.edit(edit);

          var newAST = TreeSitterDomainObject.parser.parse(newSourceCode, domainObject.treeSitter.tree);

          DomainObject.updateFromTreeSitter(domainObject, newAST.rootNode)
          expect(domainObject.children[0].children[0].type, "type").to.equal("const")
          expect(domainObject.children.length, "edit size").to.equal(3)
          expect(domainObject.children[0].children[0].isReplacement, "2nd let is replacement").not.to.be.true;
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
        expect(livelyCodeMirror.value, "codemirror is updated").to.match(/const a/)
        
        // lively.openComponentInWindow("lively-ast-treesitter-inspector").then(comp => comp.inspect(letObj.debugNewAST.rootNode))
        
        
        expect(letObj.debugNewAST.rootNode.child(1).text, "new ast has const").to.equal("const a = 3")
        expect(letObj.debugNewAST.rootNode.child(1).child(0).type, "new ast has const").to.equal("const")
        
        var newIdentifierNode = letObj.debugNewAST.rootNode.child(1).child(1).child(0)
        expect(newIdentifierNode.text, "new identifier").to.equal("a")
        expect(newIdentifierNode.id, "identifier keeps same").to.equal(oldIdentifierNode.id)
        
        
        var constObj = obj.children[1].children[0]
        expect(constObj.type, "old AST changed type ").to.equal("const")
         
        // #TODO continue here... we need Franken-ASTs ... 
        // Goals:
        // (1) reuse as much old TreeSitterDomainObjects and only create new ones that are acutally needed
        // (2) have a consistent new TreeSitter AST behind
        // (2a) OPTIONAL: start with the frankstein chenanigans on the tree-sitter level an mix and match there
      });      
    });
  });
  
  
  describe('query', () => {
    it('parses an empty query', () => {
      expect(parseQuery('()')).to.eql({parensType: '(', children: []})
    });
    
    it('parses a number', () => {
      expect(parseQuery('43')).to.eql({content: '43'})
    });
    
    it('parses a number in a form', () => {
      expect(parseQuery('(43)')).to.eql({parensType: '(', children: [{content: '43'}]})
    });
    
    it('parses two children in a form', () => {
      expect(parseQuery('(43 42)')).to.eql({parensType: '(', children: [{content: '43'}, {content: '42'}]})
    });
    
    it('parses a nested form', () => {
      expect(parseQuery('(32 (43) @ab)')).to.eql({
        parensType: '(', children: [
          {content: '32'},
          {parensType: '(', children: [{content: '43'}]},
          {content: '@ab'},
        ]})
    });
    
    xit('parses let query', () => {
      expect(parseQuery('(lexical_declaration ["let" "const"] @myKind) @root')).to.eql({
        parensType: '(', children: [
          {content: '32'},
          {parensType: '(', children: [{content: '43'}]},
          {content: '@ab'},
        ]})
    });
  });
    
  describe('SmilyReplacementDomainObject', () => {
    
    it('click on let replacement works', () => {

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
      expect(livelyCodeMirror.value).to.match(/const a/)
      expect(domainObject.treeSitter.childCount, "childCount after replacement").to.equal(3)
      expect(domainObject.children.length, "children after replacement").to.equal(3)

      var newConsDomainObject = domainObject.children[1].children[0]
      expect(newConsDomainObject.type, "newConst").to.equal("const")
    });

    it('click on const and then on let replacement', () => {
      var sourceCode = 
`// hello
let a = 3 + 4 
const b = a`
      livelyCodeMirror.value = sourceCode

      let domainObject = TreeSitterDomainObject.fromSource(sourceCode)
      domainObject.replaceType('let', LetSmilyReplacementDomainObject)
      domainObject.replaceType('const', ConstSmilyReplacementDomainObject)


      var consReplacement = domainObject.children[2].children[0]
      
      debugger
      consReplacement.target.setText(livelyCodeMirror, "let")
      
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
    
    
    it('click on let and then on cons replacement', () => {
      var sourceCode = 
`// hello
let a = 3 + 4 
const b = a`
      livelyCodeMirror.value = sourceCode

      let domainObject = TreeSitterDomainObject.fromSource(sourceCode)
      domainObject.replaceType('let', LetSmilyReplacementDomainObject)
      domainObject.replaceType('const', ConstSmilyReplacementDomainObject)

      var letReplacement = domainObject.children[1].children[0]
      letReplacement.target.setText(livelyCodeMirror, "const")

      var consReplacement = domainObject.children[2].children[0]
      consReplacement.target.setText(livelyCodeMirror, "let")
      expect(livelyCodeMirror.value).to.match(/let b/)
      expect(domainObject.treeSitter.childCount, "childCount after replacement").to.equal(3)
      expect(domainObject.children.length, "children after replacement").to.equal(3)

      var newLetDomainObject = domainObject.children[2].children[0]
      expect(newLetDomainObject.type, "newLet").to.equal("let")
    });
  })     
});