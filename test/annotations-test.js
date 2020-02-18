import {expect} from 'src/external/chai.js'
import {Annotation} from 'src/client/annotations.js'
import Annotations from 'src/client/annotations.js'
import diff from 'src/external/diff-match-patch.js';
const dmp = new diff.diff_match_patch();

describe('Annotation', function() {
  describe('equals', function() {
    var a = new Annotation({name: "a"})
    var b = new Annotation({name: "b"})
    var c = new Annotation({name: "a"})
    it('equals identitical', function() {
      expect(a.equals(a)).to.be.true
    });
    it('not equals different', function() {
      expect(a.equals(b)).to.be.false
    });
    it('equals same', function() {
      expect(a.equals(c)).to.be.true
    });
  });
})

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
  
  
  describe('diffAnnotation', function() {
    it('simple case', function() {
      let annotationsBase = new Annotations()
      annotationsBase.addAll([{name: "x", from: 3, to: 6}, {name: "i", from: 5, to: 7}])
      let annotationsA = new Annotations(annotationsBase)
      annotationsA.addAll([{name: "a", from: 10, to: 18}])
      
      
      
      let annotationsDiff = annotationsBase.diffAnnotations(annotationsA)
      expect(annotationsDiff.same.size, "size").to.equal(2)
      expect(annotationsDiff.add.size, "size").to.equal(1)
      
    });
  })
  
  describe('has', function() {
    let a = new Annotation({name: "a"})
    let b = new Annotation({name: "b"})
    let annotations = new Annotations([a])
    it('contains a', function() {
      expect(annotations.has(a)).to.be.true;
    });
    it('contains not b', function() {
      expect(annotations.has(b)).to.be.false;
    });
  })
  
  
  describe('compare', function() {
    it('simple case', function() {
      let a = new Annotation({name: "a"})
      let b = new Annotation({name: "b"})
      let c = new Annotation({name: "c"})
      
      
      let annotations = new Annotations([a,b])
      let {same, add, del} = annotations.compare(new Annotations([a,c])) 
      
      expect(same, "same").to.eql(new Annotations([a]))
      expect(add, "add").to.eql(new Annotations([c]))
      expect(del, "del").to.eql(new Annotations([b]))
      
    });
  })
  
});


