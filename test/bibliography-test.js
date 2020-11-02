import {expect} from 'src/external/chai.js';
import Bibliography from "src/client/bibliography.js"
import Parser from 'src/external/bibtexParse.js';

describe('Bibliography', () => {
  
  describe('filenameToKey', () => {
    it('converts normal filename', async function() {
      expect(Bibliography.filenameToKey("AuthorSecondauthor_1981_TitleInCammelCase_BOOK.pdf")).to.equal("Author1981TCC")
    });
    
    it('converts normal prefixed with index number', async function() {
      expect(Bibliography.filenameToKey("00_Winograd_1996_Introduction.pdf")).to.equal("Winograd1996I")
    });

    it('converts normal prefixed with long index number', async function() {
      expect(Bibliography.filenameToKey("121001_Winograd_1996_Introduction.pdf")).to.equal("Winograd1996I")
    });
    
    it('converts normal prefixed with index number and letter', async function() {
      expect(Bibliography.filenameToKey("00C_Winograd_1996_Introduction.pdf")).to.equal("Winograd1996I")
    });
  })
  
  describe('generateCitationKey', () => {
    it('simple', async function() {
      expect(Bibliography.generateCitationKey({
        entryTags: {
          author: "Tom Jones",
          year: 1972,
          title: "Nothing to See Here!"
        }
      })).to.equal("Jones1972NSH")
    });
    
    it('Name with and in name', async function() {
      expect(Bibliography.generateCitationKey({
        entryTags: {
          author: "Tom Joand and Wilboar Fundi",
          year: 1972,
          title: "Nothing to See Here Again!"
        }
      })).to.equal("Joand1972NSH")
    });
    
    
    it('Title with -oriented' , async function() {
      expect(Bibliography.generateCitationKey({
        entryTags: {
          author: "Tom Joand and Wilboar Fundi",
          year: 1972,
          title: "Nothing-oriented to See Here Again!"
        }
      })).to.equal("Joand1972NOS")
    });
  })
  
  describe('updateBibtexEntryInSource', () => {
    var source = `
@article{Schmidt1981FPB,
          title={First paper in bibliography},
          author={Hans Schmidt},
          year={1981},
        }

@article{Mustermann2020,
          title={Old title for nothing},
          author={Hans Mustermann},
          year={2020},
        }

@article{Zoro1992LPB,
          title={Last paper in bibliography},
          author={Alfons Zoro},
          year={1992},
        }
`
     var newentry =  {
          "citationKey": "Mustermann2020",
          "entryType": "article",
          "entryTags": {
            "title": "New title for nothing",
            "author": "Hans Mustermann",
            "year": "2020"
          }
        }
    
    
    it('replaces entries field', () => {
      var newsource = Bibliography.patchBibtexEntryInSource(source, "Mustermann2020", newentry)
      // old stuff is still there
      expect(newsource).to.match(/Schmidt1981FPB/)
      expect(newsource).to.match(/Zoro1992LPB/)
      
      
      expect(newsource).to.match(/New title for nothing/)
      expect(newsource).to.not.match(/old title for nothing/)
    })
  })
  
    
  describe('generateCitationKey', () => {
    it('simple case', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: "Hans Mustermann",
        year: 1992,
        title: "Simple Example Article with Three Significant Words in the Title",
      }})
      expect(key).to.equal("Mustermann1992SEA")
    });

    it('ignores small words', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: "Hans Mustermann",
        year: 1992,
        title: "A Simple Example of an Article with Three Significant Words in the Title",
      }})
      expect(key).to.equal("Mustermann1992SEA")
    });
    
    it('deals with complex names', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: "Bob O'Brian",
        year: 1992,
        title: "A Simple Example of an Article with Three Significant Words in the Title",
      }})
      expect(key).to.equal("Obrian1992SEA")
    });

    it('ignores numbers ', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: "Hans Mustermann",
        year: 1994,
        title: "Jahresbericht 1993 der Gesellschaft für Nüscht",
      }})
      expect(key).to.equal("Mustermann1994JGN")
    });

    
    it('ignores special chars ', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: "Hans Mustermann",
        year: 1994,
        title: "Jahresbericht (2018)",
      }})
      expect(key).to.equal("Mustermann1994J")
    });

    
  })
  
});
