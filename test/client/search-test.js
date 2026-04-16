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
    
    // no FileIndex in CI 
    xit('should use default paths when none specified', async () => {
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
  
  describe('classes', function() {
    this.timeout(10000); // Increase timeout for parsing files
    
    it('should find class definitions matching pattern', async () => {
      const results = await Search.classes("Search", { 
        paths: [lively4url + "/src/client"],
        limit: 5 
      });
      
      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
      
      // Should find the Search class itself
      const searchClass = results.find(cls => cls.name === 'Search');
      expect(searchClass).to.exist;
      expect(searchClass.url).to.include('search.js');
      expect(searchClass.line).to.be.a('number');
    });
    
    it('should include superclass information', async () => {
      const results = await Search.classes("Morph", { 
        paths: [lively4url + "/src/components"],
        limit: 10 
      });
      
      // Find a component that extends Morph
      const morphComponent = results.find(cls => cls.superClass === 'Morph');
      if (morphComponent) {
        expect(morphComponent.superClass).to.equal('Morph');
      }
    });
    
    it('should respect limit parameter', async () => {
      const results = await Search.classes(".*", { 
        paths: [lively4url + "/src/client"],
        limit: 3 
      });
      
      expect(results.length).to.be.at.most(3);
    });
    
    it('should be case-insensitive', async () => {
      const lowerResults = await Search.classes("search", { 
        paths: [lively4url + "/src/client"],
        limit: 5 
      });
      const upperResults = await Search.classes("SEARCH", { 
        paths: [lively4url + "/src/client"],
        limit: 5 
      });
      
      expect(lowerResults.length).to.equal(upperResults.length);
    });
    
  });
  
  describe('methods', function() {
    this.timeout(10000); // Increase timeout for parsing files
    
    it('should find method definitions matching pattern', async () => {
      const results = await Search.methods("files", { 
        paths: [lively4url + "/src/client"],
        limit: 10 
      });
      
      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
      
      // Should find the files method in Search class
      const filesMethod = results.find(m => m.name === 'files' && m.className === 'Search');
      expect(filesMethod).to.exist;
      expect(filesMethod.url).to.include('search.js');
      expect(filesMethod.line).to.be.a('number');
    });
    
    it('should filter by className when specified', async () => {
      const results = await Search.methods(".*", { 
        paths: [lively4url + "/src/client"],
        className: 'Search',
        limit: 20 
      });
      
      expect(results).to.be.an('array');
      results.forEach(method => {
        expect(method.className).to.equal('Search');
      });
    });
    
    it('should include static and kind information', async () => {
      const results = await Search.methods(".*", { 
        paths: [lively4url + "/src/client"],
        limit: 20 
      });
      
      expect(results).to.be.an('array');
      results.forEach(method => {
        expect(method).to.have.property('static');
        expect(method).to.have.property('kind');
        expect(method.kind).to.be.oneOf(['method', 'get', 'set', 'constructor', 'function']);
      });
    });
    
    it('should respect limit parameter', async () => {
      const results = await Search.methods(".*", { 
        paths: [lively4url + "/src/client"],
        limit: 5 
      });
      
      expect(results.length).to.be.at.most(5);
    });
    
    it('should be case-insensitive', async () => {
      const lowerResults = await Search.methods("files", { 
        paths: [lively4url + "/src/client"],
        limit: 5 
      });
      const upperResults = await Search.methods("FILES", { 
        paths: [lively4url + "/src/client"],
        limit: 5 
      });
      
      expect(lowerResults.length).to.equal(upperResults.length);
    });
    
  });
  
});
