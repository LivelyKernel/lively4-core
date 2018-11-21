var newModuleGlobal1; // r:
newModuleGlobal1 = 42; // r
newModuleGlobal1 + 34; // r

let newModuleGlobalForShadowing = 42; // r:
{
  newModuleGlobalForShadowing; // r
  newModuleGlobalForShadowing = 42; // r
  {
    let newModuleGlobalForShadowing;
    newModuleGlobalForShadowing;
    newModuleGlobalForShadowing = 42;
    {
      newModuleGlobalForShadowing = 42;
    }
  }
}

unboundGlobal;
unboundGlobal = 13;
{
  //shadowed unboundGlobal
  let unboundGlobal = 13;
  unboundGlobal;
}

moduleBoundGlobal1.foo(); // r
moduleBoundGlobal1 = 13; // r

unboundGlobal.moduleBoundGlobal1;
unboundGlobal[moduleBoundGlobal1]; // r


export default glob5;
export { glob5 };
export { glob5 as glob6 };
glob5;

var newModuleBoundGlobalExported; // r:
//export default glob5;
export { newModuleBoundGlobalExported }; // :r
export { newModuleBoundGlobalExported as stuff23 }; // :r

// catching node types:

// UpdateExpression
newModuleGlobal1++; // r

// Pattern in VariableDeclarator
var { newModuleGlobal2 } = { newModuleGlobal2: 42 } // r:

// Pattern outside of VariableDeclarator
var newModuleGlobal3; // r:
({ newModuleGlobal3 } = { newModuleGlobal3: 42 }); // r
[newModuleGlobal3] = [42]; // r

//############################################################################################################
//############################################################################################################
//############################################################################################################

class ACLASS {} // r:
new ACLASS(); // r

import foo from 'foo.js';
import * as bar from 'bar.js';
import { blub as blublub } from 'blub.js';

const const2 = 0;
let var1 = 3, var2;
var obj = {};

function floob() {}
console.log(var1 + 4)
// set module-bound variable
var1;
var1 = 4;
foo();
floob()
obj.attr = 4;

{
  let nonModuleGlobal = 17;
  nonModuleGlobal = 12;
  
  globalInScope
}

glob
// TODO
glob = 42;

(function(arg) {
  var1;
  console.log(arg)
})()
console

glob;
glob?3:0;
-glob;

() => {
  glob
}
var foo17 = {
  glob() {
    foo17
    {
      let foo17
      foo17;
    }
  }
}
foo17.glob
import {glob as glob42  }from 'foo';
//function glob() {}
() => {
  class glob{}
}

// ---

{
() => {
  let glob;
  glob;
}
}


//############################################################################################################
//############################################################################################################
//############################################################################################################

// Legend
// r -> should be replaced in place
// r: -> should assign to var recorder next line
// :r -> should assign the actual variable from recorder variable in previous line 
