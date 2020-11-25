import {expect} from 'src/external/chai.js';
import Bibliography from "src/client/bibliography.js"
import Parser from 'src/external/bibtexParse.js';

describe('Bibliography', () => {

  
  describe('threeSignificantInitialsFromTitle', () => {
    it('removes dashes', async function() {
      var title = `{OffscreenCanvas} — {Speed} up {Your} {Canvas} {Operations} with a {Web} {Worker}`
      debugger
      expect(Bibliography.threeSignificantInitialsFromTitle(title)).to.equal("OSU")
    });
  })
  
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
    
    it('splits number words correctly', async function() {
        expect(Bibliography.filenameToKey(
          "EdwardsRoy_2017_AcademicResearchInThe21stCenturyMaintainingScientificIntegrityIn.pdf" 
        )).to.equal("Edwards2017ARC")
    });
    
    it('splits after numbers', async function() {
        expect(Bibliography.filenameToKey(
          "Ingalls_1978_TheSmalltalk76ProgrammingSystemDesignAndImplementation.pdf" 
        )).to.equal("Ingalls1978SPS")
    });
    it('splits after numbers', async function() {
        expect(Bibliography.filenameToKey(
          "SmithWolczkoUngar_1997_FromKansasToOzCollaborativeDebuggingWhenSharedWorldBreaks.pdf" 
        )).to.equal("Smith1997KOC")
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
    
    it('ignores short words', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: "Foo Edwards",
        year: 2017,
        title: "Academic Research In The 21st Century Maintaining Scientific Integrity",
      }})
      expect(key).to.equal("Edwards2017ARC")
    });
    
    it('ignores special chars ', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: "Hans Mustermann",
        year: 1994,
        title: "{Jahresbericht (2018)}",
      }})
      expect(key).to.equal("Mustermann1994J")
    });
    
     
    it('splits slashes ', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: "Hans Mustermann",
        year: 1994,
        title: "Interactive record/replay for web application debugging",
      }})
      expect(key).to.equal("Mustermann1994IRR")
    });

    it('handles  On-the-fly', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: "Hans Mustermann",
        year: 1994,
        title: "Projection Boxes: On-the-fly Reconfigurable Visualization for Live Programming.",
      }})
      expect(key).to.equal("Mustermann1994PBO")
    });
    
    it('stripps tex formatting', async function() {
      var key = Bibliography.generateCitationKey({entryTags: {
        author: `G{\\"u}nter, Manuel and Ducasse, St{\\'e}phane and Nierstrasz, Oscar`,
        year: 1998,
        title: "Explicit connectors for coordination of active objects.",
      }})
      // Design choices
      // (a) Unicode
      // expect(key).to.equal("Günter1998ECC")
      
      // (b) no umlauts in keys...
      // expect(key).to.equal("Gunter1998ECC")

      // (c) converted umlauts
      expect(key).to.equal("Guenter1998ECC")  
    });
    
  })
  
});
