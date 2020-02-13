import {expect} from 'src/external/chai.js'
import Annotations from 'src/client/annotations.js'
import diff from 'src/external/diff-match-patch.js';
const dmp = new diff.diff_match_patch();

describe('Annotations', function() {
  describe('applyDiff', function() {
    it('moves on insert before', function() {
      let diff = dmp.diff_main("abcdefghi", "abcXYZdefghi");
      
      let annotations = new Annotations([
        {from: 3, to: 5}
      ])      
      annotations.applyDiff(diff)
      expect(annotations.list[0].from, "from").to.equal(6)
      expect(annotations.list[0].to, "to").to.equal(8)
      
    });
    
    it('stays same on insert after', function() {
      let diff = dmp.diff_main("abcdefghi", "abcdefXYZghi");
      let annotations = new Annotations([
        {from: 3, to: 5}
      ])      
      annotations.applyDiff(diff)
      expect(annotations.list[0].from, "from").to.equal(3)
      expect(annotations.list[0].to, "to").to.equal(5)
      
    });
  })
  
  
  
  describe('regions', function() {
    it('3 regions', function() {
      let text = "abcdefghi"
      let annotations = new Annotations([
        {name: "b", from: 3, to: 5}
      ])      
      var regions = annotations.regions(text)
      expect(regions.length, "length").to.equal(3)
    });
  })
  
  describe('isInRegion', function() {
    let annotations = new Annotations()      
    it("before", function() {
      expect(annotations.isInRegion({from: 0, to: 1}, {name: "b", from: 3, to: 5})).to.equal(false)
    })   
    
    it("before and on border", function() {
      expect(annotations.isInRegion({from: 0, to: 2}, {name: "b", from: 3, to: 5})).to.equal(false)
    }) 
    
    it("half in", function() {
      expect(annotations.isInRegion({from: 0, to: 4}, {name: "b", from: 3, to: 5})).to.equal(true)
    }) 
    it("complete in", function() {
      expect(annotations.isInRegion({from: 0, to: 10}, {name: "b", from: 3, to: 5})).to.equal(true)
    })
    it("half out", function() {
      expect(annotations.isInRegion({from: 4, to: 10}, {name: "b", from: 3, to: 5})).to.equal(true)
    })
    it("complete out", function() {
      expect(annotations.isInRegion({from: 6, to: 10}, {name: "b", from: 3, to: 5})).to.equal(false)
    })
  })
  
  
  
  describe('toXML', function() {
    it('print xml', function() {
      let text = "abcdefghi"
      
      let annotations = new Annotations([
        {name: "b", from: 3, to: 6}
      ])      
      
      var xml = annotations.toXML(text)
      expect(xml, "xml").to.equal("abc<b>def</b>ghi")
    });
  })
  
  
  describe('add', function() {
    it('adds one', function() {
      let annotations = new Annotations()
      annotations.add({name: "b", from: 3, to: 6})
      expect(annotations.size, "size").to.equal(1)
    });
  })
   
  describe('addAll', function() {
    it('adds all', function() {
      let annotations = new Annotations()
      annotations.addAll([{name: "b", from: 3, to: 6}, {name: "i", from: 5, to: 7}])
      expect(annotations.size, "size").to.equal(2)
    });
  })
  
});
