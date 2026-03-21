/*
 * Show parameter data for literature-paper.js
 * 
 * Run in browser console or lively workspace:
 * import script from "browse://demos/claude/show-literature-paper-params.js"
 * script.showParams()
 */

import FileIndex from "src/client/fileindex.js"
import {parseModuleSemanticsFromSource} from "src/client/javascript.js"

export async function showParams() {
  const url = "https://lively-kernel.org/lively4/lively4-core/src/components/literature/literature-paper.js";
  
  console.log("=== Literature Paper Method Data ===\n");
  
  const index = FileIndex.current();
  
  // First, try to get from database
  const classes = await index.db.classes
    .where("url")
    .equals(url)
    .toArray();
  
  if (classes.length === 0) {
    console.log("⚠️  No classes found in database. Parsing file directly...\n");
    
    // Parse the file directly
    const source = await fetch(url).then(r => r.text());
    const semantics = parseModuleSemanticsFromSource(url, source);
    
    if (semantics.classes.length > 0) {
      console.log("✓ Parsed file successfully\n");
      displayClasses(semantics.classes);
      
      console.log("\n💡 To store this in the database, run:");
      console.log(`   FileIndex.current().updateFile("${url}")`);
    }
  } else {
    console.log("✓ Found in database\n");
    displayClasses(classes);
  }
  
  // Also check for top-level functions
  const functions = await index.db.functions
    .where("url")
    .equals(url)
    .toArray();
  
  if (functions.length > 0) {
    console.log("\n=== Top-level Functions ===\n");
    displayFunctions(functions);
  }
}

function displayClasses(classes) {
  classes.forEach(cls => {
    console.log(`📦 Class: ${cls.name}`);
    if (cls.superClassName) {
      console.log(`   Extends: ${cls.superClassName}`);
    }
    console.log(`   Lines of code: ${cls.loc}`);
    console.log(`   Methods: ${cls.methods ? cls.methods.length : 0}\n`);
    
    if (cls.methods && cls.methods.length > 0) {
      cls.methods.forEach((method, idx) => {
        // Build method signature
        let signature = '';
        if (method.static) signature += 'static ';
        if (method.kind === 'get') signature += 'get ';
        if (method.kind === 'set') signature += 'set ';
        
        // Add parameters
        const paramStr = formatParameters(method.params);
        signature += `${method.name}(${paramStr})`;
        
        console.log(`   ${idx + 1}. ${signature}`);
        console.log(`      📏 ${method.loc} lines (${method.start}-${method.end})`);
        
        if (method.params && method.params.length > 0) {
          method.params.forEach(p => {
            let icon = '      ';
            if (p.type === 'rest') icon += '...';
            else if (p.type === 'default') icon += '?';
            else if (p.type === 'destructure') icon += '{}';
            else icon += '  ';
            
            console.log(`${icon} ${formatParameter(p)}`);
          });
        }
        console.log('');
      });
    }
  });
}

function displayFunctions(functions) {
  functions.forEach((func, idx) => {
    const paramStr = formatParameters(func.params);
    console.log(`   ${idx + 1}. function ${func.name}(${paramStr})`);
    console.log(`      📏 ${func.loc} lines`);
    
    if (func.params && func.params.length > 0) {
      func.params.forEach(p => {
        console.log(`      ${formatParameter(p)}`);
      });
    }
    console.log('');
  });
}

function formatParameters(params) {
  if (!params || params.length === 0) return '';
  
  return params.map(p => {
    if (p.type === 'rest') return `...${p.name}`;
    if (p.type === 'default') return `${p.name}?`;
    if (p.type === 'destructure') {
      if (p.properties && p.properties.length > 0) {
        return `{${p.properties.join(', ')}}`;
      }
      return p.name;
    }
    return p.name;
  }).join(', ');
}

function formatParameter(p) {
  let str = `${p.name} : ${p.type}`;
  
  if (p.type === 'destructure' && p.properties) {
    str += ` [${p.properties.join(', ')}]`;
  }
  if (p.type === 'default') {
    str += ` = ${p.defaultValue}`;
  }
  
  return str;
}

// Auto-run if possible
if (typeof window !== 'undefined') {
  console.log("Run: showParams()");
}

export default { showParams };
