const moduleNameToVarRecorderName = new Map();

function randomModuleId() {
  return (`_module_${Math.random()}`).replace('.', '');
}

export function getScopeIdForModule(moduleName) {
  // console.log("XXX", moduleName);
  if(!moduleNameToVarRecorderName.has(moduleName)) {
    moduleNameToVarRecorderName.set(moduleName, (moduleName || "undefined").replace(/[^a-zA-Z0-9]/g,"_") /* randomModuleId() */);
  }

  return moduleNameToVarRecorderName.get(moduleName);
}

export default function({ types: t, template, traverse, }) {
  
  const GENERATED = Symbol('generated');
  function isMarked(node) {
    return node[GENERATED];
  }
  function mark(node) {
    node[GENERATED] = true;
    return node;
  }
  
  // TODO: is there a general way to exclude non-variables?
  function isVariable(path) {
    // - filter out with negative conditions
    if(t.isLabeledStatement(path.parent) && path.parentKey === 'label') return false;
    if(t.isBreakStatement(path.parent) && path.parentKey === 'label') return false;
    if(t.isForInStatement(path.parent) && path.parentKey === 'left') return false;
    if(t.isFunctionExpression(path.parent) && path.parentKey === 'id') return false;
    if(t.isImportDefaultSpecifier(path.parent) && path.parentKey === 'local') return false;
    if(t.isCatchClause(path.parent) && path.parentKey === 'param') return false;
    if(t.isObjectProperty(path.parent) && path.parentKey === 'key') return false;
    if(t.isClassDeclaration(path.parent)) return false;
    if(t.isClassMethod(path.parent)) return false;
    if(t.isImportSpecifier(path.parent)) return false; // correct?
    if(t.isMemberExpression(path.parent) && path.parentKey === 'property' && !path.parent.computed) return false; // TODO: correct?
    if(t.isObjectMethod(path.parent)) return false;
    if(t.isFunctionDeclaration(path.parent)) return false;
    if((t.isArrowFunctionExpression(path.parent) && path.parentKey === 'params')) return false;
    if((t.isFunctionExpression(path.parent) && path.parentKey === 'params')) return false;
    if(t.isRestElement(path.parent)) return false;

    // TODO: 2nd stage:
    // - return true on known conditions
    return true;
    
    // - throw error at others
  }
  
  function bubbleThroughPattern(path) {
    if(path.parentPath.isArrayPattern() && path.parentKey === 'elements') return bubbleThroughPattern(path.parentPath);
    if(path.parentPath.isRestElement() && path.parentKey === 'argument') return bubbleThroughPattern(path.parentPath);
    if(path.parentPath.isObjectPattern() && path.parentKey === 'properties') return bubbleThroughPattern(path.parentPath);
    if(path.parentPath.isObjectProperty() && path.parentKey === 'value') return bubbleThroughPattern(path.parentPath);
    if(path.parentPath.isRestProperty() && path.parentKey === 'argument') return bubbleThroughPattern(path.parentPath);
    return path;
  }

  function log(path, pre) {
    return console.log(`path of type ${path.type}`, pre);
  }
  
  function logIdentifier(path, pre = '') {
    console.log(pre + `${path.node.name} in ${path.parentPath.node.type} as ${path.key}`);
  }
  
  function logBinding(binding, pre = '') {
    console.log(pre + `${binding.identifier.name}`);
  }
  
  return {
    name: "top-level-var-recorder",
    pre(...args) {
      // console.log('XXXX', ...args);
      //console.clear();
    },
    post(...args) {
      // console.log('YYYY', ...args);
    },
    visitor: {
      Program(program, { file }) {
        const DOIT_MATCHER = /^workspace(async)?(js)?:/;
        const MODULE_MATCHER = /.js$/;
        
        let filename = file.log.filename;
        // console.log('visitor!', program, filename);
        
        const VAR_RECORDER_NAME = '_recorder_' || '__varRecorder__';
        let MODULE_NAME;
        if(window.__topLevelVarRecorder_ModuleNames__ && DOIT_MATCHER.test(filename) && !MODULE_MATCHER.test(filename)) {
          var codeId = filename.replace(DOIT_MATCHER,"") // workspace: becomes workspacejs... e.g. and we are only interested in the id ...
          MODULE_NAME = window.__topLevelVarRecorder_ModuleNames__[codeId];
          // console.log("boundEval MODULE_NAME: " + MODULE_NAME + " codeId: " + codeId)
        } else if (!DOIT_MATCHER.test(filename) && MODULE_MATCHER.test(filename)) {
          // eval a .js file
          MODULE_NAME = filename;
        } else {
          throw new Error('Transpiling neither a .js module nor workspace code');
        }
        let MODULE_IDENTIFIER = getScopeIdForModule(MODULE_NAME);

        const varToRecordTemplate = template(`${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.reference = reference`),
              recordToVarTemplate = template(`reference = ${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.reference`),
              referenceTemplate = template(`${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.reference`);
        function replaceReference(ref) {
          ref.replaceWith(referenceTemplate({ reference: ref.node }).expression);
          ref.skip();
        }
        
        window[VAR_RECORDER_NAME] = window[VAR_RECORDER_NAME] || {};
        window[VAR_RECORDER_NAME][MODULE_IDENTIFIER] = window[VAR_RECORDER_NAME][MODULE_IDENTIFIER] || {};
        let moduleBoundGlobals = Object.keys(window[VAR_RECORDER_NAME][MODULE_IDENTIFIER]);
        // console.log('bound names:', ...moduleBoundGlobals);

        let bindings = program.scope.getAllBindings();

        // iterate all module wide bindings
        Object.values(bindings).forEach(binding => {
          binding.referencePaths
            .filter(ref => {
              // ExportNamedDeclarations should not be rewritten as reference
              // they are already rewritten as binding
              if(ref.isExportNamedDeclaration()) {
                return false;
              }
              // Same for declaring the default export
              if(ref.isExportDefaultDeclaration()) {
                return false;
              }
              
              // handle named exports special
              if(ref.parentPath.isExportSpecifier() && ref.parentKey === 'local') {
                ref
                  .find(path => path.parentPath.isProgram())
                  .insertBefore(recordToVarTemplate({ reference: mark(t.identifier(binding.identifier.name)) }))
                  .forEach(newPath => newPath.skip());
                ref.skip();
                return false;
              }
              
              // ObjectPatterns and ArrayPatterns in VariableDeclarations do not accept MemberExpressions.
              // Thus, we have to filter out these cases explicitly.
              if(ref.findParent(p=>p.isPattern()) && ref.findParent(p=>p.isDeclaration())) {
                let pattern = bubbleThroughPattern(ref);
                if(pattern.parentPath.isVariableDeclarator() && pattern.parentKey === 'id') return false;
              }
              return true;
            })
            .forEach(replaceReference);
          
          // dealing with the declaration of the binding
          let varToRecord = varToRecordTemplate({ reference: t.identifier(binding.identifier.name) });
          if(binding.kind === 'hoisted'/* || binding.kind === 'module'*/) {
            binding.path
              .find(path => path.isProgram())
              .unshiftContainer('body', varToRecord);
          } else {
            // #DesignQuestion
            // a) should we add a guard here and check if the variable was recorded and we are reloaded
            // b) change the semantics of variable declarations to be assigned with "undefined" if first time loaded [as implemented below]
            if (!binding.path.node.init)
              binding.path.node.init = referenceTemplate({
                reference: t.identifier(binding.identifier.name)}).expression;
            binding.path
              .getStatementParent()
              .insertAfter(varToRecord)
              .forEach(newPath => newPath.skip());
          }
        });
    
        program.traverse({
          Identifier(path) {
            if(isMarked(path.node)) return;
            if(!isVariable(path)) return;
    
            // special case of assigning to a reference
            let pattern = bubbleThroughPattern(path);
            if(pattern.parentPath.isAssignmentExpression() && pattern.parentKey === 'left') {
              let par = path.find(parent => parent.scope.hasOwnBinding(path.node.name));
              // is our binding scope the module-wide scope?
              if(par && par.scope === program.scope) {
                replaceReference(path);
                return path.skip();
              }
            }
            
            // Distinguish between module-bound variables and real globals
            if(
              path.scope.hasGlobal(path.node.name) &&
                moduleBoundGlobals.includes(path.node.name)
            ) {
              replaceReference(path);
              return path.skip();
            }
          }
        });
      }
    }
  };

}
