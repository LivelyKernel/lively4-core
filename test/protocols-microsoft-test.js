
import {expect} from 'src/external/chai.js';

import {MicrosoftScheme} from "src/client/protocols/microsoft.js"


describe('MicrosoftScheme', async () => {

  var microsoftScheme = new MicrosoftScheme() 
    
  describe('getMetaDataType', () => {
 
    
    
    it('parses entity sets', async () => {
      var entity = await microsoftScheme.getMetaDataType("users/")
      expect(entity).not.be.undefined
      expect(entity.getAttribute("Name")).equal("users")
    });
    
    
    it('parses simple entities', async () => {
      var entity = await microsoftScheme.getMetaDataType("workbookRange")
      expect(entity).not.be.undefined
      expect(entity.getAttribute("Name")).equal("workbookRange")
    });
    
    it('parses entities', async () => {
      var entity = await microsoftScheme.getMetaDataType("users/$entity")
      expect(entity).not.be.undefined
      expect(entity.getAttribute("Name")).equal("user")
    });
    

    it('parses functions', async () => {
      var entity = await microsoftScheme.getMetaDataType("users('jensl81%40gmx.de')")
      expect(entity).not.be.undefined
      expect(entity.getAttribute("Name")).equal("user")
    });
    
    it('parses function with navigation', async () => {
      var entity = await microsoftScheme.getMetaDataType("users('jensl81%40gmx.de')/drive")
      
      expect(entity).not.be.undefined
      expect(entity.getAttribute("Name")).equal("drive")
    });
   
     it('parses paths', async () => {
      var entity = await microsoftScheme.getMetaDataType("users('jensl81%40gmx.de')/drive/root")
      expect(entity).not.be.undefined
      expect(entity.getAttribute("Name")).equal("driveItem")
    });
    
    it('parses paths', async () => {
      var entity = await microsoftScheme.getMetaDataType("users('jensl81%40gmx.de')/drive/root/$entity")
      expect(entity).not.be.undefined
      expect(entity.getAttribute("Name")).equal("driveItem")
    });

    it('parses workbook', async () => {
      var entity = await microsoftScheme.getMetaDataType("users('jensl81%40gmx.de')/drive/root/workbook/$entity")
      expect(entity).not.be.undefined
      expect(entity.getAttribute("Name")).equal("workbook")
    });

    
    
    it('parses worksheet', async () => {
      var entity = await microsoftScheme.getMetaDataType("users('jensl81%40gmx.de')/drive/root/workbook/worksheets/$entity")
      expect(entity).not.be.undefined
      expect(entity.getAttribute("Name")).equal("workbookWorksheet")
    });
    
    
  })
    
})