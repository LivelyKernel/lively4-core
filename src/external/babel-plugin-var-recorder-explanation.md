# Var Recorder

So many JavaScript files:

- <browse://src/external/babel-plugin-var-recorder.js>
- <browse://src/external/babel-plugin-var-recorder-dev.js>
- <browse://src/external/babel-plugin-var-recorder-example.js>
- <browse://src/external/babel-plugin-var-recorder-requirements.js>
- <browse://src/external/babel-plugin-var-recorder-requirements3.js>

```javascript
Program(path) {
  let bindings = path.scope.getAllBindings();
  Object.values(bindings).forEach(binding => {
    binding.referencePaths.forEach(replaceReference);
    binding.path.find(path => path.parentPath.isProgram()).insertAfter(defineReference(binding));
  });
},
```

Which turns:

```JavaScript
import foo from 'foo.js';
let var1 = 3;

foo(var1);
```

into:

```JavaScript
import foo from 'foo.js';
_recorder_._module_.foo = foo;
let var1 = 3;
_recorder_._module_.var1 = var1;

_recorder_._module_.foo(_recorder_._module_.var1);
```

However, globals seem to be much more difficult, e.g. we would like to rewrite global variables the same way. So:

```JavaScript
globalVar.func();
```
should turn into:

```JavaScript
_recorder_._module_.globalVar.func();
```


However, until now, we were unable to identify all references to global variables. E.g. `scope.globals` provides all names of global variables, but does not provide a list of Identifier nodes representing those global variables. Has anyone an idea how to achieve this?


---

```javascript

(function ({ types: t, template, traverse }) {

  window.__varRecorder__ = {
    __defaultModule__: {
      glob: 'glob'
    }
  };

  const VAR_RECORDER_NAME = window.__topLevelVarRecorderName__ || '_recorder_' || '__varRecorder__',
  MODULE_IDENTIFIER = window.__topLevelVarRecorder_ModuleName__ || '_module_' || '__defaultModule__';
  
  // TODO: replace explicit node creation with templates
  //const REFERENCE_TEMPLATE = template(`VARRECORDER.MODULE.REFERENCEIDENTIFIER`);
  //REFERENCE_TEMPLATE({
    //VARRECORDER: VAR_RECORDER_NAME,
    //MODULE: MODULE_IDENTIFIER,
    //REFERENCEIDENTIFIER: ref.node.name
  //})
  function replaceReference(ref) {
    ref.replaceWith(t.memberExpression(
      t.memberExpression(
        t.identifier(VAR_RECORDER_NAME),
        t.identifier(MODULE_IDENTIFIER)
      ),
      ref.node
    ));
  }
  
  return {
    name: "top-level-var-recorder", // not required
    visitor: { 
      Program(path) {
        console.clear();
        
        let { scope } = path,
        bindings = path.scope.getAllBindings();
        console.log(path.scope.globals);
        console.log(bindings);
        path.unshiftContainer('body', t.variableDeclaration('var', [
          t.variableDeclarator(t.identifier('glob'))
        ]));
        console.log("---", path.scope)
        //path.scope.rename('foo', 'foo2')
        console.log()
        Object.values(bindings).forEach(binding => {
          console.log(binding.identifier.name, binding);
          binding.referencePaths.forEach(replaceReference)
          
          //if(binding.kind !== 'var') return;
          binding.path.find(path => path.parentPath.isProgram()).insertAfter(t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(
                t.memberExpression(
                  t.identifier(VAR_RECORDER_NAME),
                  t.identifier(MODULE_IDENTIFIER)
                ),
                t.identifier(binding.identifier.name)
              ),
              t.identifier(binding.identifier.name)
            )
          ));
        });
        
        path.traverse({
          Identifier(path) {
            return;
            debugger
            if(path.foo) console.log('Found global', path.node.name)
          }
        })
      },
      Identifier(path) {
        // special case of assigning to a reference
        // TODO: distinguish between module-bound variables and real globals! (do not rewrite real globals)
        if(path.parentPath.isAssignmentExpression() && path.parentKey === 'left') {
          console.log(path.node.name, path.isReferencedIdentifier(), path.isReferenced())
          replaceReference(path)
        }
      }
    }
  };
})
```



_________________________


```javascript
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
```