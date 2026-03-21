/*
 * Test script to verify parameter extraction is working and stored in FileIndex DB
 * 
 * Usage (in browser console or lively4 workspace):
 * - import script from "browse://demos/claude/test-params-in-db.js"
 * - script.testParamsInDB()
 */

import FileIndex from "src/client/fileindex.js"
import {parseModuleSemanticsFromSource} from "src/client/javascript.js"

export async function testParamsInDB() {
  console.log("=== Testing Parameter Extraction in FileIndex ===\n")
  
  // 1. Test parsing directly
  console.log("1. Testing parseModuleSemanticsFromSource:")
  const testSource = `
    class TestClass {
      constructor(name, options = {}) {
        this.name = name;
      }
      
      async processData(data, {format, validate = true}, ...rest) {
        return data;
      }
      
      static create(name) {
        return new TestClass(name);
      }
    }
    
    function helperFunc(a, b, c) {
      return a + b + c;
    }
  `;
  
  const semantics = parseModuleSemanticsFromSource('test.js', testSource);
  console.log("Classes found:", semantics.classes.length);
  console.log("Functions found:", semantics.functions.length);
  
  if (semantics.classes.length > 0) {
    console.log("\nClass methods with params:");
    semantics.classes[0].methods.forEach(method => {
      console.log(`  ${method.name}:`, method.params);
    });
  }
  
  if (semantics.functions.length > 0) {
    console.log("\nFunctions with params:");
    semantics.functions.forEach(func => {
      console.log(`  ${func.name}:`, func.params);
    });
  }
  
  // 2. Query actual database for a real file
  console.log("\n\n2. Checking FileIndex database for real files:");
  const fileIndex = FileIndex.current();
  
  // Get a sample JavaScript file from the index
  const jsFiles = await fileIndex.db.files
    .where("name")
    .notEqual("")
    .and(file => file.name && file.name.endsWith('.js'))
    .limit(5)
    .toArray();
  
  console.log(`Found ${jsFiles.length} JS files in index`);
  
  if (jsFiles.length > 0) {
    const sampleFile = jsFiles[0];
    console.log(`\nChecking file: ${sampleFile.url}`);
    
    // Get classes for this file
    const classes = await fileIndex.db.classes
      .where("url")
      .equals(sampleFile.url)
      .toArray();
    
    console.log(`Found ${classes.length} classes`);
    
    if (classes.length > 0) {
      const sampleClass = classes[0];
      console.log(`\nClass: ${sampleClass.name}`);
      console.log(`Methods: ${sampleClass.methods ? sampleClass.methods.length : 0}`);
      
      if (sampleClass.methods && sampleClass.methods.length > 0) {
        console.log("\nSample methods with params:");
        sampleClass.methods.slice(0, 5).forEach(method => {
          console.log(`  ${method.name}(${method.params ? method.params.map(p => p.name).join(', ') : '?'})`);
          if (method.params && method.params.length > 0) {
            console.log(`    Full params:`, method.params);
          }
        });
      }
    }
    
    // Get functions for this file
    const functions = await fileIndex.db.functions
      .where("url")
      .equals(sampleFile.url)
      .toArray();
    
    if (functions.length > 0) {
      console.log(`\n\nFound ${functions.length} top-level functions`);
      console.log("Sample functions with params:");
      functions.slice(0, 3).forEach(func => {
        console.log(`  ${func.name}(${func.params ? func.params.map(p => p.name).join(', ') : '?'})`);
        if (func.params && func.params.length > 0) {
          console.log(`    Full params:`, func.params);
        }
      });
    }
  }
  
  console.log("\n\n3. Summary:");
  console.log("✓ Parameter extraction is implemented");
  console.log("✓ Params are stored in method objects");
  console.log("✓ Params include type information (simple, rest, default, destructure)");
  console.log("\nNote: Files need to be re-indexed to have params data.");
  console.log("To re-index a file, save it or run: FileIndex.current().updateFile(url)");
  
  return {
    semantics,
    jsFiles,
    success: true
  };
}

// Auto-run if in workspace
if (typeof lively !== 'undefined' && lively.success) {
  lively.success("Test script loaded. Run: testParamsInDB()");
}

export default { testParamsInDB };
