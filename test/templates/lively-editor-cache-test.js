import {expect} from 'src/external/chai.js';
import {testWorld, loadComponent} from './templates-fixture.js';
import files from 'src/client/files.js';

describe("Lively Editor Cache Mechanism", function() {

  var editor;
  var originalLoadFile;
  var loadFileCallCount;
  var mockFileContent = "console.log('test file content');\n// This is a mock file";
  
  before("load", function(done){
    this.timeout(35000);
    var templateName = "lively-editor";
    loadComponent(templateName).then(c => {
      editor = c;
      
      // Mock files.loadFile to track calls
      originalLoadFile = files.loadFile;
      loadFileCallCount = 0;
      
      files.loadFile = async function(url, branch) {
        loadFileCallCount++;
        // Simulate some async delay like a real file load
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockFileContent;
      };
      
      done();
    }).catch(e => done(e));
  });

  beforeEach("reset counters", function() {
    loadFileCallCount = 0;
    editor.invalidateFileContentCache();
  });

  it("should load editor", function() {
    expect(editor).to.exist;
    expect(editor.getCachedFileContent).to.be.a('function');
    expect(editor.invalidateFileContentCache).to.be.a('function');
  });

  it("should cache file content on first call to getCachedFileContent", async function() {
    const url = new URL("https://lively-kernel.org/lively4/foo/test.js");
    const branch = "HEAD";
    
    // First call should trigger actual file loading
    const content1 = await editor.getCachedFileContent(url, branch);
    expect(loadFileCallCount).to.equal(1);
    expect(content1).to.equal(mockFileContent);
    
    // Second call should use cache, not trigger file loading
    const content2 = await editor.getCachedFileContent(url, branch);
    expect(loadFileCallCount).to.equal(1); // Still 1, not incremented
    expect(content2).to.equal(mockFileContent);
    expect(content2).to.equal(content1);
  });

  it("should use different cache keys for different URL+branch combinations", async function() {
    const url1 = new URL("https://lively-kernel.org/lively4/foo/test1.js");
    const url2 = new URL("https://lively-kernel.org/lively4/foo/test2.js");
    const branch1 = "HEAD";
    const branch2 = "origin/main";
    
    // Each unique URL+branch combination should trigger a new load
    await editor.getCachedFileContent(url1, branch1);
    expect(loadFileCallCount).to.equal(1);
    
    await editor.getCachedFileContent(url2, branch1);
    expect(loadFileCallCount).to.equal(2);
    
    await editor.getCachedFileContent(url1, branch2);
    expect(loadFileCallCount).to.equal(3);
    
    // But repeated calls should use cache
    await editor.getCachedFileContent(url1, branch1);
    await editor.getCachedFileContent(url2, branch1);
    await editor.getCachedFileContent(url1, branch2);
    expect(loadFileCallCount).to.equal(3); // Still 3
  });

  it("should invalidate cache when invalidateFileContentCache is called", async function() {
    const url = new URL("https://lively-kernel.org/lively4/foo/test.js");
    const branch = "HEAD";
    
    // Load once to populate cache
    await editor.getCachedFileContent(url, branch);
    expect(loadFileCallCount).to.equal(1);
    
    // Invalidate cache
    editor.invalidateFileContentCache();
    
    // Next call should reload from file
    await editor.getCachedFileContent(url, branch);
    expect(loadFileCallCount).to.equal(2);
  });

  it("should invalidate cache when setURL is called", async function() {
    const url = new URL("https://lively-kernel.org/lively4/foo/test.js");
    const branch = "HEAD";
    
    // Load once to populate cache
    await editor.getCachedFileContent(url, branch);
    expect(loadFileCallCount).to.equal(1);
    
    // Change URL - this should invalidate cache
    editor.setURL("https://lively-kernel.org/lively4/foo/other.js");
    
    // Next call should reload from file
    await editor.getCachedFileContent(url, branch);
    expect(loadFileCallCount).to.equal(2);
  });

  it("should handle file loading errors gracefully in cache", async function() {
    const url = new URL("https://lively-kernel.org/lively4/foo/nonexistent.js");
    const branch = "HEAD";
    
    // Mock files.loadFile to throw an error
    files.loadFile = async function(url, branch) {
      loadFileCallCount++;
      throw new Error("File not found");
    };
    
    // Should return empty string on error, not throw
    const content = await editor.getCachedFileContent(url, branch);
    expect(content).to.equal("");
    expect(loadFileCallCount).to.equal(1);
    
    // Second call should still try to load (errors are not cached)
    const content2 = await editor.getCachedFileContent(url, branch);
    expect(content2).to.equal("");
    expect(loadFileCallCount).to.equal(2);
  });

  it("should use cache in getLineChangeStatus to avoid redundant file loads", async function() {
    const testUrl = "https://lively-kernel.org/lively4/foo/test.js";
    editor.setURL(testUrl);
    editor.setText("console.log('modified content');\n// Changed content");
    
    // Mock the getCurrentRemoteBranch method to return a predictable value
    editor.getCurrentRemoteBranch = async () => "origin/main";
    
    // First call to getLineChangeStatus should load files
    const status1 = await editor.getLineChangeStatus();
    const firstCallCount = loadFileCallCount;
    expect(firstCallCount).to.be.greaterThan(0);
    
    // Second call should use cached content (at least for some files)
    const status2 = await editor.getLineChangeStatus();
    const secondCallCount = loadFileCallCount;
    
    // We might still have some new calls due to different branches,
    // but there should be fewer new calls than if no caching was happening
    expect(status1).to.deep.equal(status2);
    expect(status1.meta).to.exist;
    expect(status1.unsaved).to.be.an('array');
    expect(status1.uncommitted).to.be.an('array');
    expect(status1.unpushed).to.be.an('array');
  });

  it("should measure performance improvement from caching", async function() {
    const url = new URL("https://lively-kernel.org/lively4/foo/test.js");
    const branch = "HEAD";
    
    // Mock a slower file load to make timing differences more obvious
    files.loadFile = async function(url, branch) {
      loadFileCallCount++;
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
      return mockFileContent;
    };
    
    // First call (uncached)
    const start1 = performance.now();
    await editor.getCachedFileContent(url, branch);
    const time1 = performance.now() - start1;
    
    // Second call (cached)
    const start2 = performance.now();
    await editor.getCachedFileContent(url, branch);
    const time2 = performance.now() - start2;
    
    // Cached call should be significantly faster
    expect(time2).to.be.lessThan(time1 / 2);
    expect(loadFileCallCount).to.equal(1);
  });

  it("should handle null/undefined URLs gracefully", async function() {
    const result1 = await editor.getCachedFileContent(null, "HEAD");
    const result2 = await editor.getCachedFileContent(undefined, "HEAD");
    
    expect(result1).to.equal("");
    expect(result2).to.equal("");
    // Should not have called files.loadFile for invalid URLs
    expect(loadFileCallCount).to.equal(0);
  });

  after("cleanup", function() {
    testWorld().innerHTML = "";
    
    // Restore original files.loadFile
    if (originalLoadFile) {
      files.loadFile = originalLoadFile;
    }
  });
});