import {expect} from 'src/external/chai.js';



import {Parser, JavaScript, match, isomorphic} from 'src/client/tree-sitter.js';


var parser = new Parser();
parser.setLanguage(JavaScript);

function parseAll(sources) {
  return sources.map(ea => parser.parse(ea))
}

describe('tree-sitter', () => {
  describe('isomorphic', () => {
    it('find identical trees', async () => {    
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, `let a = 3 + 4`])      
      expect(isomorphic(tree1.rootNode, tree2.rootNode)).to.be.true
    })
    
    it('find identical trees with added whitespace', async () => {    
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, ` let 
a   = 3 + 4`])      
      expect(isomorphic(tree1.rootNode, tree2.rootNode)).to.be.true
    })
    
    it('find different trees', async () => {    
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, `let a = 3 + 5`])      
      expect(isomorphic(tree1.rootNode, tree2.rootNode)).to.be.false
    })
    
    it('find different structured trees', async () => {    
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, `let a = 3 + 4; let b`])      
      expect(isomorphic(tree1.rootNode, tree2.rootNode)).to.be.false
    })
  })
    
  describe('match', () => {

    it('match identical trees', async () => {

        let [tree1, tree2] = parseAll([`let a = 3 + 4`,`let a = 3 + 4`])
        var matches = match(tree1.rootNode, tree2.rootNode)
        
        expect(matches.length).gt(5)
        for(let match of matches) {
          expect(match.node1.text).to.equal(match.node2.text)
        }
    })
    
    it('should match unganged trees', async () => {
      let [tree1, tree2] = parseAll([`let a = 3 + 4`, `let a = 3 + 4\na++`])      
        var matches = match(tree1.rootNode, tree2.rootNode)
        expect(matches.length).gt(5)      
        for(let match of matches) {
          if (match.node1.text !== tree1.rootNode.text) {
            expect(match.node1.text).to.equal(match.node2.text)            
          }
        }
    })
  })
})