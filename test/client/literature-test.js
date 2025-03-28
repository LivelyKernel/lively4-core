import {expect} from 'src/external/chai.js';

import {AlexPaper} from 'src/client/literature.js'



describe('Literature', () => {

  var alexExampleWork
  var paper;
  
  before(async () => {
    alexExampleWork = await fetch(lively4url + '/test/client/literature-alex-work-example.json').then(r => r.json())
    
    paper = new AlexPaper(alexExampleWork);
  })

  
  describe('AlexPaper', () => {
    it('constructor ', () => {      
      expect(paper.value).to.equal(alexExampleWork)    
      expect(alexExampleWork.id).to.be.a("string")
    });
    
    
    it('has authors ', () => {  
      expect(paper.authors).to.be.an("array")      
      expect(paper.authors.length).to.equal(9)
      expect(paper.authors[0].value).to.be.an("object")
      expect(paper.authors[0].name, "name").to.be.a("string")
      expect(paper.authors[0].id, "id").to.be.a("string")
    });
    
    it('has a year ', () => {  
      expect(paper.year).to.be.a("number")      
    });

    it('has a title ', () => {  
      expect(paper.title).to.be.a("string")      
    });

    it('has a doi ', () => {  
      expect(paper.doi).to.be.a("string")      
    });

    it('has bibtex type ', () => {  
      expect(paper.bibtexType).to.equal("article")      
    });

    it('has book title ', () => {  
      expect(paper.booktitle).to.be.a("string")      
    });

    
    it('has citation keys ', () => {  
      expect(paper.key).to.be.a("string")      
      expect(paper.key).to.equal("Piwowar2018SOL")      
    });

    
    it('has an id', () => {  
      expect(paper.alexid).to.be.a("string")      
      expect(paper.alexid).to.equal("W2741809807")      
    });

    
  })
});