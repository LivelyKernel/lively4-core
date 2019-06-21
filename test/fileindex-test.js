
import {expect} from 'src/external/chai.js';

import FileIndex from "src/client/fileindex.js"
import Paths from "src/client/paths.js"

describe('FileIndex', () => {
  
  var sut = new FileIndex("fileindex_test")
  
  describe('normalizePath', () => {
    it('relative path with dir', async function() {
      expect(Paths.normalizePath("hello.md", "http://foo/bar/")).to.equal("http://foo/bar/hello.md")
    });
    it('relative path with file', async function() {
      expect(Paths.normalizePath("hello.md", "http://foo/bar/blub.md")).to.equal("http://foo/bar/hello.md")
    });
    
    it('absolute path', async function() {
      expect(Paths.normalizePath("/hello.md", "http://foo/bar/huh/blub.md", "http://foo/bar")).to.equal("http://foo/bar/hello.md")
    });
    
    it('keep URLs', async function() {
      expect(Paths.normalizePath("http://foo/bar/hello.md", "http://foo/bar/huh/blub.md", "http://foo/bar")).to.equal("http://foo/bar/hello.md")
    });
    
    it('resolve relative parts', async function() {
      expect(Paths.normalizePath("../hello.md", "http://foo/bar/blub.md")).to.equal("http://foo/hello.md")
    });
  })
});
