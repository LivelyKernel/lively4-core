import {expect} from 'src/external/chai.js';


import PriorityQueue from "src/external/priority-queue.js"

import {Parser, JavaScript, match, isomorphic} from 'src/client/tree-sitter.js';

// test internals
import {pop, peekMax, height, dice, query, parseAll} from 'src/client/tree-sitter.js';

describe('tree-sitter', () => {
  describe('priority list', () => {

    describe('pop', () => {
      it("should return set", () => {
        var list = new PriorityQueue((a, b) => a.height > b.height)
        list.push({height: 3, node: "a"})
        list.push({height: 2, node: "b"})
        list.push({height: 3, node: "c"})

        expect(peekMax(list)).to.equal(3)

        
        
        var result = pop(list)
        
        expect(result.size).to.equal(2)
        expect(Array.from(result).sort()).to.eql(["a", "c"])

      })
    })
    
    
    describe('dice', () => {
      it("indentical subtrees", () => {
        let [tree1, tree2] = parseAll([`foo.bar()`, `foo.bar()`])      
        var callExpr1 = tree1.child(0).child(0)
        var callExpr2 = tree2.child(0).child(0)
        
        var matches = match(tree1, tree2)
        
        expect(matches.length).gt(3)
        
      
        var result = dice(callExpr1,callExpr2, matches)
        
        expect(result).to.equal(1)
        
        
      })
      it("indentical subtrees", () => {
        let [tree1, tree2] = parseAll([`foo.bar()`, `foo.bar();1`])      
       
        
        var matches = match(tree1, tree2)
        
        expect(matches.length).gt(3)
        
        var result = dice(tree1, tree2, matches)
        
        expect(result).gt(0)
        expect(result).lt(1)
        
        
      })
    })
    
    describe('height', () => {
      it("literal", () => {
        let [tree] = parseAll([`4`])   
        
        expect(height(tree.child(0).child(0))).to.equal(1)
      })
      it("binary expression", () => {
        let [tree] = parseAll([`3 + 4`])
        
        expect(height(tree.child(0).child(0))).to.equal(2)
      })

    })

    
  })
  
  
  describe('isomorphic', () => {
    it('find identical trees', async () => {    
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, `let a = 3 + 4`])      
      expect(isomorphic(tree1, tree2)).to.be.true
    })
    
    it('find identical trees with added whitespace', async () => {    
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, ` let 
a   = 3 + 4`])      
      expect(isomorphic(tree1, tree2)).to.be.true
    })
    
    it('find different trees', async () => {    
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, `let a = 3 + 5`])      
      expect(isomorphic(tree1, tree2)).to.be.false
    })
    
    it('find different structured trees', async () => {    
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, `let a = 3 + 4; let b`])      
      expect(isomorphic(tree1, tree2)).to.be.false
    })
  })
    
  describe('match', () => {

    it('match identical trees', async () => {

        let [tree1, tree2] = parseAll([`let a = 3 + 4`,`let a = 3 + 4`])
        var matches = match(tree1, tree2)
        
        expect(matches.length).gt(5)
        for(let match of matches) {
          expect(match.node1.text).to.equal(match.node2.text)
        }
    })
    
    it('should match unchanged sub trees', async () => {
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, `let a = 3 + 4\na++`])      
        var matches = match(tree1, tree2)
        expect(matches.length).gt(5)      
        for(let match of matches) {
          if (match.node1.text !== tree1.text) {
            expect(match.node1.text, match.node1.type + " -> " + match.node2.type).to.equal(match.node2.text)            
          }
        }
    })
    
    it('should match moved code', async () => {
      let [tree1, tree2] = parseAll([`x()
foo.bar()`, `x()
if (true) {
  foo.bar()
}
`])     
      
        // that.tree.language.query("(variable_declarator)@a").captures(this)
        var callExpr1 = tree1.child(1).child(0)
        var callExpr2 = tree2.child(1).child(2).child(1).child(0)
        
        
        var matches = match(tree1, tree2)
        
        expect(matches.length).gt(5) 
      
        let found = matches.find(ea => ea.node1.id == callExpr1.id && ea.node2.id == callExpr2.id)
        
        expect(found).to.not.be.undefined
        
    })
    
    
    it('works in paper example', async () => {
      let [tree1, tree2] = parseAll([`class Test { 
  foo(i) { 
    if (i == 0) return "Foo!"
  } 
}`, `class Test { 
  foo(i) { 
    if (i == 0) return "Bar"
    else if (i == -1) return "Foo!"
  } 
}`])     
      
        // that.tree.language.query("(variable_declarator)@a").captures(this)
        var classDecl1 = tree1.child(0)
        var classDecl2 = tree2.child(0)
        
        var matches = match(tree1, tree2)
        
        expect(matches.length).gt(10) 
        
        
        let found = matches.find(ea => ea.node1.id == classDecl1.id && ea.node2.id == classDecl2.id)
        
        expect(found).to.not.be.undefined
        
    })
    
    it('does not map bogus', async () => {
      let [tree1, tree2] = parseAll([`let a = 4`, `{let a = 3}`])     
      
        // that.tree.language.query("(variable_declarator)@a").captures(this)
        var matches = match(tree1, tree2, 0, 5)
        
      
        for(let match of matches) {
          expect(match.node1.type).to.equal(match.node2.type)
        }
      
        
        
    })
    
    it('does map parent nodes if child notes change only slightly', async () => {
      let [tree1, tree2] = parseAll([`let a = 3`, `{let a = 4}`])     
      
        // that.tree.language.query("(variable_declarator)@a").captures(this)
        var matches = match(tree1, tree2, 0, 5)
        
      
        for(let match of matches) {
          expect(match.node1.type).to.equal(match.node2.type)
        }
      
        
        var lex1 = query(tree1, "(lexical_declaration)@a")[0].node
        var lex2 = query(tree2, "(lexical_declaration)@a")[0].node

        expect(matches.some(ea => ea.node1.id == lex1.id && ea.node2.id == lex2.id), "dice").to.be.true
      // lively.openInspector(matches)
        
    })
    
  })
})