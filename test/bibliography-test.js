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
});
