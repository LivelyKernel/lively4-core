import { expect } from 'src/external/chai.js';

import { Parser, JavaScript, match, parseAll, query, addMapping } from 'src/client/tree-sitter.js';

// test internals
import { ChawatheScriptGenerator, EditScript, Insert, preOrderIterator} from 'src/client/domain-code/chawathe-script-generator.js';


describe('ChawatheScriptGenerator', () => {


  describe('deepCopyTree', () => {

    it("copy simple expression", () => {
        
      
      let [tree1] = parseAll([`3 + 4`])


      var sut = new ChawatheScriptGenerator()

      var result = sut.deepCopyTree(tree1)

      expect(result.id).to.equal(tree1.id)
      expect(result.type).to.equal(tree1.type)
      expect(result.children.length).to.equal(tree1.children.length)
      expect(result.children[0].children[0].children.length).to.equal(3)

        
      
        
    })
  })
  
  
  describe('preOrderIterator', () => {

    it("iterate over tree", () => {
      
      
      let [tree] = parseAll([`3`])
      
      var generator = new ChawatheScriptGenerator()
      var iter = preOrderIterator(tree)
        
      var count = 0
      
      while(iter.next().value) {
        count ++ 
      }
  
      
      expect(count).to.equal(3)
        
    })
    
    
    it("iterate manually", () => {
      
      
      let [tree] = parseAll([`3`])
      
      var generator = new ChawatheScriptGenerator()
      var iter = preOrderIterator(tree)
        
      var count = 0
      
      var program = iter.next().value
      var expr = iter.next().value
      var number = iter.next().value
      
      
      
      expect(number.type).to.equal("number")
        
    })
  })
  
  
  describe('generate', () => {

    it("finds insert actions", () => {
      let [tree1, tree2] = parseAll([`3 + 4`, `3 + 4; 5`])

      var mappings = match(tree1, tree2)
      
      
      var sut = new ChawatheScriptGenerator()
      sut.initWith(tree1, tree2, mappings) 

      sut.generate()
      
      
      expect(sut.actions.size()).to.be.greaterThan(0)

      expect(sut.actions.get(0).type).to.equal("insert")
      
    })
    
    it("finds move action", () => {
      let [tree1, tree2] = parseAll([`var a = 3`, `{var a = 3}`])

      var mappings = match(tree1, tree2)
      
      
      var sut = new ChawatheScriptGenerator()
      sut.initWith(tree1, tree2, mappings) 

      sut.generate()
      
      expect(sut.actions.get(2).type).to.equal("move")
      expect(sut.actions.get(2).pos, "pos").to.equal(1)

      expect(sut.actions.get(3).type).to.equal("insert")
      expect(sut.actions.get(3).node.type).to.equal("}")
      expect(sut.actions.get(3).pos, "pos").to.equal(2)

      
    })

    
  })
  
  
})


describe('EditScript', () => {


  describe('add action', () => {

    it("adds insert", () => {
      let editScript = new EditScript()

      editScript.add(new Insert())
      
      expect(editScript.size()).to.equal(1)
    
    })

  })


  describe('iteration ', () => {

    it("iterates over two elements", () => {
      let editScript = new EditScript()

      let insert1 = new Insert()
      editScript.add(insert1)
      
      let insert2 = new Insert()
      editScript.add(insert2)
      
      
      expect(Array.from(editScript)[0]).to.equal(insert1)
      expect(Array.from(editScript)[1]).to.equal(insert2)
    
    })

  })

})
