/*
 * Debug Script: Lively Editor Component Loading Investigation
 * 
 * This script replicates the test loading process and thoroughly investigates
 * the loaded lively-editor component to understand method availability issues.
 */

console.log("=== LIVELY EDITOR DEBUG SCRIPT ===");
console.log("Starting investigation of lively-editor component loading...\n");

// Import what the test uses
import {testWorld, loadComponent} from '../../test/templates/templates-fixture.js';

async function debugLivelyEditor() {
  try {
    console.log("1. Creating test world...");
    const world = testWorld();
    console.log("   Test world created:", world);
    console.log("   Test world innerHTML before:", world.innerHTML.length, "characters");
    
    console.log("\n2. Loading lively-editor component using loadComponent()...");
    const startTime = performance.now();
    
    const editor = await loadComponent("lively-editor");
    const loadTime = performance.now() - startTime;
    
    console.log("   Component loaded in", loadTime.toFixed(2), "ms");
    console.log("   Editor object:", editor);
    console.log("   Editor tagName:", editor.tagName);
    console.log("   Editor constructor:", editor.constructor.name);
    
    console.log("\n3. Checking basic properties...");
    console.log("   editor.isInTesting:", editor.isInTesting);
    console.log("   editor instanceof HTMLElement:", editor instanceof HTMLElement);
    console.log("   editor._fileContentCache exists:", !!editor._fileContentCache);
    
    console.log("\n4. Checking method availability...");
    const methodsToCheck = [
      'getCachedFileContent',
      'invalidateFileContentCache',
      'getURL',
      'setURL',
      'setText',
      'getText',
      'initialize'
    ];
    
    methodsToCheck.forEach(methodName => {
      const method = editor[methodName];
      console.log(`   editor.${methodName}:`, {
        exists: !!method,
        type: typeof method,
        isFunction: typeof method === 'function',
        descriptor: Object.getOwnPropertyDescriptor(editor, methodName) || 
                   Object.getOwnPropertyDescriptor(Object.getPrototypeOf(editor), methodName)
      });
    });
    
    console.log("\n5. Prototype chain investigation...");
    let current = editor;
    let level = 0;
    while (current && level < 10) {
      console.log(`   Level ${level}:`, current.constructor.name);
      
      // Check if getCachedFileContent is defined at this level
      const hasOwnMethod = Object.prototype.hasOwnProperty.call(current, 'getCachedFileContent');
      const hasOwnMethodInProto = current.constructor.prototype && 
        Object.prototype.hasOwnProperty.call(current.constructor.prototype, 'getCachedFileContent');
      
      if (hasOwnMethod || hasOwnMethodInProto) {
        console.log(`     -> getCachedFileContent found at level ${level}!`);
        console.log(`        hasOwnProperty: ${hasOwnMethod}`);
        console.log(`        in prototype: ${hasOwnMethodInProto}`);
      }
      
      current = Object.getPrototypeOf(current);
      level++;
    }
    
    console.log("\n6. All available methods and properties...");
    const allProps = [];
    let obj = editor;
    while (obj && obj !== Object.prototype) {
      const props = Object.getOwnPropertyNames(obj);
      props.forEach(prop => {
        if (!allProps.includes(prop) && prop !== 'constructor') {
          allProps.push(prop);
        }
      });
      obj = Object.getPrototypeOf(obj);
    }
    
    const methods = allProps.filter(prop => {
      try {
        return typeof editor[prop] === 'function';
      } catch (e) {
        return false;
      }
    }).sort();
    
    console.log("   Total methods found:", methods.length);
    console.log("   Methods containing 'cache':", methods.filter(m => m.toLowerCase().includes('cache')));
    console.log("   Methods containing 'file':", methods.filter(m => m.toLowerCase().includes('file')));
    
    console.log("\n7. Testing direct method access...");
    try {
      if (typeof editor.getCachedFileContent === 'function') {
        console.log("   ✅ getCachedFileContent is accessible as function");
        
        console.log("\n8. Testing method functionality...");
        
        // Test with invalid URL first
        console.log("   Testing with null URL...");
        const result1 = await editor.getCachedFileContent(null, "HEAD");
        console.log("   Result for null URL:", JSON.stringify(result1));
        
        // Test with valid URL
        console.log("   Testing with valid URL...");
        const testUrl = new URL("https://lively-kernel.org/lively4/foo/test.js");
        
        // Mock files.loadFile temporarily for testing
        const originalLoadFile = files.loadFile;
        files.loadFile = async (url, branch) => {
          console.log(`   Mock loadFile called with: ${url}, ${branch}`);
          return "mock content";
        };
        
        const result2 = await editor.getCachedFileContent(testUrl, "HEAD");
        console.log("   Result for valid URL:", JSON.stringify(result2));
        
        // Restore original
        files.loadFile = originalLoadFile;
        
      } else {
        console.log("   ❌ getCachedFileContent is NOT accessible as function");
        console.log("   Type:", typeof editor.getCachedFileContent);
        console.log("   Value:", editor.getCachedFileContent);
      }
    } catch (error) {
      console.log("   ❌ Error testing method:", error.message);
      console.log("   Stack:", error.stack);
    }
    
    console.log("\n9. Component initialization status...");
    console.log("   Editor shadowRoot:", !!editor.shadowRoot);
    console.log("   Editor isConnected:", editor.isConnected);
    console.log("   Editor parentNode:", editor.parentNode?.tagName || 'none');
    
    // Check if initialize was called
    console.log("   Checking for initialization markers...");
    const codemirror = editor.get("lively-code-mirror");
    console.log("   Has CodeMirror child:", !!codemirror);
    
    console.log("\n10. Module loading verification...");
    const editorModule = await System.import('/templates/lively-editor.js');
    console.log("   Module default export:", editorModule.default);
    console.log("   Module default is constructor:", typeof editorModule.default);
    console.log("   Editor instanceof module default:", editor instanceof editorModule.default);
    
    // Check if the instance has the method from the class
    const classHasMethod = editorModule.default.prototype.hasOwnProperty('getCachedFileContent');
    console.log("   Class prototype has getCachedFileContent:", classHasMethod);
    
    if (classHasMethod) {
      console.log("   Method source length:", editorModule.default.prototype.getCachedFileContent.toString().length);
    }
    
    console.log("\n=== DEBUG COMPLETE ===");
    return editor;
    
  } catch (error) {
    console.error("❌ Debug script failed:", error);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

// Run the debug function
debugLivelyEditor()
  .then(editor => {
    console.log("\n🎉 Debug completed successfully!");
    console.log("Editor available in global scope as window.debugEditor");
    window.debugEditor = editor;
  })
  .catch(error => {
    console.error("\n💥 Debug failed:", error);
  });