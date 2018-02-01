
import {expect} from 'src/external/chai.js';
import {pt} from 'src/client/graphics.js';


describe('HTML', () => {

  describe('loadHTMLFromURL', () => {
    it('should load a div ', async (done) => {
      var element = await lively.html.loadHTMLFromURL(lively4url + "/test/sample-a.html")
      expect(element.tagName).equal("DIV")
      done()
    });
  })
  
  describe('saveAsPNG', () => {
    it('should save a png ', async (done) => {
      try {
        var url = await lively.html.saveAsPNG(lively4url + "/test/sample-a.html")
        expect(url).to.match(/png$/)
        done()        
      } catch(e) {
        done(e)
      }
    });

    it('should save html with svg to a png ', async (done) => {
      try {
        var url = await lively.html.saveAsPNG(lively4url + "/test/sample-b.html")
        expect(url).to.match(/png$/)
        done()        
      } catch(e) {
        done(e)
      }
    });

    
  })
  
  
});