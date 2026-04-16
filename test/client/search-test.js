import {expect} from 'src/external/chai.js';
import Search from 'src/client/search.js';
import FileIndex from 'src/client/fileindex.js';

describe('Search', () => {

  describe('files', () => {
    
    it('should find files matching pattern', async () => {
      const results = await Search.files("search", { limit: 5 });
      expect(results).to.be.an('array');
      expect(results.length).to.be.at.most(5);
      
      // All results should have filename matching pattern
      results.forEach(file => {
        const filename = file.url.replace(/.*\//ig, '');
        expect(filename.toLowerCase()).to.match(/search/);
      });
    });
    
    it('should respect limit parameter', async () => {
      const results = await Search.files("test", { limit: 3 });
      expect(results.length).to.be.at.most(3);
    });
    
    it('should search in specified paths only', async () => {
      const results = await Search.files("component", { 
        paths: [lively4url + "/src/components"],
        limit: 10
      });
      
      // All results should be within the specified path
      results.forEach(file => {
        expect(file.url).to.include('/src/components');
      });
    });
    
    it('should use default paths when none specified', async () => {
      const results = await Search.files("lively", { limit: 5 });
      expect(results).to.be.an('array');
      // Should find results (either from lively4url or ExtraSearchRoots)
      expect(results.length).to.be.greaterThan(0);
    });
    
    it('should be case-insensitive', async function() {
      this.timeout(5000); // Increase timeout for slow FileIndex queries
      
      const lowerResults = await Search.files("search", { 
        paths: [lively4url + "/"],
        limit: 5 
      });
      const upperResults = await Search.files("SEARCH", { 
        paths: [lively4url + "/"],
        limit: 5 
      });
      
      // Case-insensitive search should return same results
      expect(lowerResults.length).to.equal(upperResults.length);
    });
    
    it('should match regex patterns', async () => {
      const results = await Search.files(".*\\.js$", { 
        paths: [lively4url + "/src/client"],
        limit: 5 
      });
      
      results.forEach(file => {
        expect(file.url).to.match(/\.js$/);
      });
    });
    
  });
  
  describe('getSearchRoots', () => {
    
    it('should return provided paths when specified', () => {
      const paths = ['/path/one', '/path/two'];
      const roots = Search.getSearchRoots(paths);
      expect(roots).to.deep.equal(paths);
    });
    
    it('should return default path plus ExtraSearchRoots when no paths specified', () => {
      const roots = Search.getSearchRoots(undefined);
      expect(roots).to.be.an('array');
      expect(roots[0]).to.equal(lively4url + "/");
    });
    
  });
  
});
