import {expect} from 'src/external/chai.js'
import {Annotation} from 'src/client/annotations.js'
import {AnnotatedText} from 'src/client/annotations.js'

import AnnotationSet from 'src/client/annotations.js'
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
  
  describe('intersectRegion', function() {
    it("before", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).intersectRegion({from: 0, to: 1})).to.equal(null)
    })   
    
    it("before and on border", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).intersectRegion({from: 0, to: 2})).to.equal(null)
    }) 
    
    it("half in", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).intersectRegion({from: 0, to: 4})).to.eql({from: 3, to:4})
    }) 
    it("complete in", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).intersectRegion({from: 0, to: 10})).to.eql({from: 3, to:5})
    })
    it("half out", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).intersectRegion({from: 4, to: 10})).to.eql({from: 4, to: 5})
    })
    it("complete out", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).intersectRegion({from: 6, to: 10})).to.equal(null)
    })
  })
  
  
  describe('isInRegion', function() {
    it("before", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).isInRegion({from: 0, to: 1})).to.equal(false)
    })   
    
    it("before and on border", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).isInRegion({from: 0, to: 2})).to.equal(false)
    }) 
    
    it("half in", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).isInRegion({from: 0, to: 4})).to.equal(true)
    }) 
    it("complete in", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).isInRegion({from: 0, to: 10})).to.equal(true)
    })
    it("half out", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).isInRegion({from: 4, to: 10})).to.equal(true)
    })
    it("complete out", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).isInRegion({from: 6, to: 10})).to.equal(false)
    })
  })
  
   describe('cutRegion', function() {
    it("before", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).cutRegion({from: 0, to: 1})).to.eql(new Annotation({name: "b", from: 3, to: 5}))
    })   
        
    it("half in", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).cutRegion({from: 0, to: 4})).to.eql(new Annotation({name: "b", from: 4, to: 5}))
    }) 
    it("complete in", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).cutRegion({from: 0, to: 10})).to.eql(null) 
    })
    it("cut out", function() {
      expect(new Annotation({name: "b", from: 3, to: 6}).cutRegion({from: 4, to: 5})).to.eql([new Annotation({name: "b", from: 3, to: 4}), 
                                                                                              new Annotation({name: "b", from: 5, to: 6})]) 
    })
    it("half out", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).cutRegion({from: 4, to: 10})).to.eql(new Annotation({name: "b", from: 3, to: 4}))
    })
    it("complete out", function() {
      expect(new Annotation({name: "b", from: 3, to: 5}).cutRegion({from: 6, to: 10})).to.eql(new Annotation({name: "b", from: 3, to: 5}))
    })
  })
})


  
describe('AnnotationSet', function() {
  describe('applyTextDiff', function() {
    it('moves on insert before', function() {
      let textDiff = dmp.diff_main("abcdefghi", "abcXYZdefghi");
      
      let annotations = new AnnotationSet([
        {from: 3, to: 5}
      ])      
      annotations.applyTextDiff(textDiff)
      expect(annotations.list[0].from, "from").to.equal(6)
      expect(annotations.list[0].to, "to").to.equal(8)
      
    });
    
    it('stays same on insert after', function() {
      let diff = dmp.diff_main("abcdefghi", "abcdefXYZghi");
      let annotations = new AnnotationSet([
        {from: 3, to: 5}
      ])      
      annotations.applyTextDiff(diff)
      expect(annotations.list[0].from, "from").to.equal(3)
      expect(annotations.list[0].to, "to").to.equal(5)
      
    });
  })
  
  describe('mergeWithTransform', function() {
    
  })
  
  describe('merge', function() {
    var a = new Annotation({name: "a", from: 0, to: 4})  
    var b = new Annotation({name: "b", from: 2, to: 6})  
    var c = new Annotation({name: "c", from: 10, to: 20})
    var d = new Annotation({name: "d", from: 10, to: 15})
    
    var parent = new AnnotationSet([a,b])
    var me = parent.clone()
    me.add(c)
    
    var other = parent.clone()
    me.add(d)
    me.remove(b)

    
    var merged = me.merge(other, parent)
    
    expect(merged.equals([a,c,d]))
    
  })

  describe('regions', function() {
    it('3 regions', function() {
      let text = "abcdefghi"
      let annotations = new AnnotationSet([
        {name: "b", from: 3, to: 5}
      ])      
      var regions = annotations.regions(text)
      expect(regions.length, "length").to.equal(3)
      expect(regions[0]).to.eql({from: 0, to: 3, content: "abc"})
      
      
    });
    
    it('real world example', function() {
      let text = new AnnotatedText("This is some text and some annotations.", new AnnotationSet([
        {from: 8, to: 12, name: "color", color: "lightblue"},
        {from: 27, to: 38, name: "color", color: "yellow"}]))
      
      var regions = text.annotations.regions(text.text)
      
      expect(regions.length, "length").to.equal(5)
    });
     
  })
   
  describe('toXML', function() {
    it('print xml', function() {
      let text = "abcdefghi"
      
      let annotations = new AnnotationSet([
        {name: "b", from: 3, to: 6}
      ])      
      
      var xml = annotations.toXML(text)
      expect(xml, "xml").to.equal("abc<b>def</b>ghi")
    });
    
    
     it('print xml', function() {
      let text = "abcdefghi"
      
      let annotations = new AnnotationSet([
        {name: "b", from: 3, to: 6},
        {name: "i", from: 1, to: 2}
      ])      
      
      var xml = annotations.toXML(text)
      expect(xml, "xml").to.equal("a<i>b</i>c<b>def</b>ghi")
    });
  })
  
  
  describe('add', function() {
    it('adds one', function() {
      let annotations = new AnnotationSet()
      annotations.add({name: "b", from: 3, to: 6})
      expect(annotations.size, "size").to.equal(1)
    });
  })
   
  describe('addAll', function() {
    it('adds all', function() {
      let annotations = new AnnotationSet()
      annotations.addAll([{name: "b", from: 3, to: 6}, {name: "i", from: 5, to: 7}])
      expect(annotations.size, "size").to.equal(2)
    });
  })
  
  
  describe('diff', function() {
    it('simple case', function() {
      let annotationsBase = new AnnotationSet()
      annotationsBase.addAll([{name: "x", from: 3, to: 6}, {name: "i", from: 5, to: 7}])
      let annotationsA = new AnnotationSet(annotationsBase)
      annotationsA.addAll([{name: "a", from: 10, to: 18}])
      
      
      
      let annotationsDiff = annotationsBase.diff(annotationsA)
      expect(annotationsDiff.same.size, "size").to.equal(2)
      expect(annotationsDiff.add.size, "size").to.equal(1)
      
    });
  })
  
  describe('has', function() {
    let a = new Annotation({name: "a"})
    let b = new Annotation({name: "b"})
    let annotations = new AnnotationSet([a])
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
      
      
      let annotations = new AnnotationSet([a,b])
      let {same, add, del} = annotations.compare(new AnnotationSet([a,c])) 
      
      expect(same, "same").to.eql(new AnnotationSet([a]))
      expect(add, "add").to.eql(new AnnotationSet([c]))
      expect(del, "del").to.eql(new AnnotationSet([b]))
      
    });
  })
  
  describe('removeFromTo', function() {
    it('delete complete', function() {
      let a = new Annotation({from: 0, to: 5, name: "a"})
      let b = new Annotation({from: 10, to: 15, name: "b"})
      let c = new Annotation({from: 20, to: 25, name: "c"})
      
      let annotations = new AnnotationSet([a,b,c])
      annotations.removeFromTo(10,15)
      
      expect(annotations).to.eql(new AnnotationSet([a,c]))
      
    });
  })
  
  it('cuts regions', function() {
      let a = new Annotation({from: 0, to: 10, name: "a"})
      let b = new Annotation({from: 10, to: 20, name: "b"})
      
      let annotations = new AnnotationSet([a,b])
      annotations.removeFromTo(5,15)
      
      expect(annotations).to.eql(new AnnotationSet([{from: 0, to: 5, name: "a"},{from: 15, to: 20, name: "b"}]))
      
    });
  
  
});

describe('AnnotatedText', function() {

  describe('setText', function() {
    let text = new AnnotatedText("abc", new AnnotationSet([{from: 1,to:2, color: "red"}]))
    it('updates annotations', function() {
        text.setText("_abc")
        expect(text.annotations.list[0].from).to.equal(2)
        expect(text.annotations.list[0].to).to.equal(3)
    })
  })
  
  describe('fromHTML', function() {
    it('extracts text and annotations', function() {
      let text = AnnotatedText.fromHTML("a<b>b</b>c")
      expect(text.text, "text").to.equal("abc")
      expect(text.annotations.list[0].from, "from").to.equal(1)
      expect(text.annotations.equals(new AnnotationSet([{type: "Reference", content: "abc"}, 
                                                         {from: 1, to: 2, name: "b"}]))).to.be.true
    })
    
    it('extracts text and two annotations', function() {
      let text = AnnotatedText.fromHTML("a<b>b</b><i>c</i>")
      expect(text.text, "text").to.equal("abc")
      expect(text.annotations.equals(new AnnotationSet([
        {type: "Reference", content: "abc"},
        {from: 1, to: 2, name: "b"}, 
        {from: 2, to: 3, name: "i"}]))).to.true;
    })
  })
  
  
  describe("toHTML", function() {
    it('extracts text and annotations', function() {
      let text = new AnnotatedText("This is some text and some annotations.", new AnnotationSet([
        {from: 8, to: 12, name: "color", color: "lightblue"},
        {from: 27, to: 38, name: "color", color: "yellow"}]))
      expect(text.toHTML(), "text").to.equal("This is <color>some</color> text and some <color>annotations</color>.")
      
    })
  })

  // we use HTML annotations just, because it's easier to read and write... 
  describe("mergeAnnotations", function() {
   
    
    it('merges', async function() {
      var textConflict = `We say: Hello and World!`

      // but we convert them first to our stand-off markup... before testing them. 
      var l4aBase = AnnotatedText.fromHTML(`Hello <b>World</b>`).toSource()
      var l4aVersionA = AnnotatedText.fromHTML(`<u>We say:</u> Hello <b>World</b>`).toSource()
      var l4aVersionB = AnnotatedText.fromHTML(`<i>Hello</i> and <b>World</b>!`).toSource()

      // just for illustration... 
      var l4aConflict = `<<<<<<< HEAD
  ${l4aVersionA}
  =======
  ${l4aVersionB}
  >>>>>>> annotationsVersionB`

      var l4aExpectedMergeHTML = `<u>We say:</u> <i>Hello</i> and <b>World</b>!`
            
      var versionA = await AnnotatedText.fromSource(l4aVersionA)
      var versionB = await AnnotatedText.fromSource(l4aVersionB)
      var base = await AnnotatedText.fromSource(l4aBase)

      var result = await AnnotatedText.mergeAnnotations(versionA, versionB, base, textConflict)      
      
      expect(result.toHTML()).equals(l4aExpectedMergeHTML)
    })
  })
    
  // and now a little bit easier for the eyes  
  it('merge A content and B annotation change', async function() {
    var textConflict = `Hello and World`
            
    var base = AnnotatedText.fromHTML(`Hello World`)
    var versionA = AnnotatedText.fromHTML(`Hello and World`)
    var versionB = AnnotatedText.fromHTML(`Hello <b>World</b>`)

    var l4aExpectedMergeHTML = `Hello and <b>World</b>`
    var result = await AnnotatedText.mergeAnnotations(versionA, versionB, base, textConflict)      

    expect(result.toHTML()).equals(l4aExpectedMergeHTML)
  })
  
})

