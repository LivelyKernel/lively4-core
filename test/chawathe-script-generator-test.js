import { expect } from 'src/external/chai.js';

import { Parser, JavaScript, match, parseAll, query, addMapping } from 'src/client/tree-sitter.js';

// test internals
import { ChawatheScriptGenerator, EditScript, Insert} from 'src/client/domain-code/chawathe-script-generator.js';


describe('ChawatheScriptGenerator', () => {


  describe('deepCopyTree', () => {

    it("copy simple expression", () => {
      try {
        
      
      let [tree1] = parseAll([`3 + 4`])


      var sut = new ChawatheScriptGenerator()

      var result = sut.deepCopyTree(tree1)

      expect(result.id).to.equal(tree1.id)
      expect(result.type).to.equal(tree1.type)
      expect(result.children.length).to.equal(tree1.children.length)
      expect(result.children[0].children[0].children.length).to.equal(3)

        
            } catch(e) {
              debugger
            }

        
    })
  })
  
  
  describe('generate', () => {

    it("finds actions", () => {
      let [tree1, tree2] = parseAll([`3 + 4`, `3 + 4; 5`])

      var mappings = match(tree1, tree2)
      
      
      var sut = new ChawatheScriptGenerator()
      sut.initWith(tree1, tree2, mappings) 

      sut.generate()
      
      
      expect(sut.actions.size()).to.be.greaterThan(0)

      expect(sut.actions.get(0).type).to.equal("insert")
      
    })
    
    it("finds actions", () => {
      let [tree1, tree2] = parseAll([`3 + 4`, `3 + 4; 5`])

      var mappings = match(tree1, tree2)
      
      
      var sut = new ChawatheScriptGenerator()
      sut.initWith(tree1, tree2, mappings) 

      sut.generate()
      
      
      expect(sut.actions.size()).to.be.greaterThan(0)

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
