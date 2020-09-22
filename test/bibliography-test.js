import {expect} from 'src/external/chai.js';
import Bibliography from "src/client/bibliography.js"

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
  
  
});
