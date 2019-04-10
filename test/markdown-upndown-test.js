
import {expect} from 'src/external/chai.js';

import Upndown from 'src/external/upndown.js'

describe('Markdown Upndown', () => {

  describe('convert', () => {
    it('should convert h1 to #', async () => {
      var converter = new Upndown()
      var source = await converter.convert("<h1>hello</h1", {keepHtml: true})
      expect(source).equal("# hello")
    });
    
    it('should mark attributes', async () => {
      var converter = new Upndown()
      var source = await converter.convert("<h1 bar='foo'>hello</h1", {keepHtml: true})
      expect(source).equal(`# hello{bar="foo"}`)
    });

    
    it('should mark ids in attributes', async () => {
      var converter = new Upndown()
      var source = await converter.convert("<h1 id='foo'>hello</h1", {keepHtml: true})
      expect(source).equal(`# hello{id="foo"}`)
    });

    it('should mark classes in attributes specially', async () => {
      var converter = new Upndown()
      var source = await converter.convert("<h1 class='foo'>hello</h1", {keepHtml: true})
      expect(source).equal(`# hello{.foo}`)
    });
    
    it('should mark strip null and defined', async () => {
      var converter = new Upndown()
      var source = await converter.convert("<h1 foo='null'>hello</h1", {keepHtml: true})
      expect(source).equal(`# hello`)
    });
  })
  
  
});