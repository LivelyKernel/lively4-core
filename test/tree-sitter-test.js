import {expect} from 'src/external/chai.js';


import PriorityQueue from "src/external/priority-queue.js"

import {Parser, JavaScript, match, isomorphic} from 'src/client/tree-sitter.js';

// test internals
import {pop, peekMax, height} from 'src/client/tree-sitter.js';


var parser = new Parser();
parser.setLanguage(JavaScript);

function parseAll(sources) {
  return sources.map(ea => parser.parse(ea).rootNode)
}

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
    
    describe('height', () => {
      it("literal", () => {
        let [tree] = parseAll([`4`])   
        debugger
        expect(height(tree.child(0).child(0))).to.equal(1)
      })
      it("binary expression", () => {
        let [tree] = parseAll([`3 + 4`])
        debugger
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
            expect(match.node1.text).to.equal(match.node2.text)            
          }
        }
    })
  })
})