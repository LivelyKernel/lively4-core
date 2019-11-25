const moduleNameToVarRecorderName = new Map();


console.log("VAR RECORDER DEV")

export function getScopeIdForModule(moduleName) {
  // console.log("[babel-plugin-var-recorder] getScopeIdForModule", moduleName);
  if (!moduleNameToVarRecorderName.has(moduleName)) {
    moduleNameToVarRecorderName.set(moduleName,
      (moduleName || "undefined").replace(lively4url, "").replace(/[^a-zA-Z0-9]/g, "_"));
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
    if (t.isLabeledStatement(path.parent) && path.parentKey === 'label') return false;
    if (t.isBreakStatement(path.parent) && path.parentKey === 'label') return false;
    if (t.isForInStatement(path.parent) && path.parentKey === 'left') return false;
    if (t.isFunctionExpression(path.parent) && path.parentKey === 'id') return false;
    if (t.isImportDefaultSpecifier(path.parent) && path.parentKey === 'local') return false;
    if (t.isCatchClause(path.parent) && path.parentKey === 'param') return false;
    if (t.isObjectProperty(path.parent) && path.parentKey === 'key') return false;
    if (t.isClassDeclaration(path.parent)) return false;
    if (t.isClassMethod(path.parent)) return false;
    if (t.isImportSpecifier(path.parent)) return false; // correct?
    if (t.isMemberExpression(path.parent) && path.parentKey === 'property' && !path.parent.computed) return false; // TODO: correct?
    if (t.isObjectMethod(path.parent)) return false;
    if (t.isFunctionDeclaration(path.parent)) return false;
    if ((t.isArrowFunctionExpression(path.parent) && path.parentKey === 'params')) return false;
    if ((t.isFunctionExpression(path.parent) && path.parentKey === 'params')) return false;
    if (t.isRestElement(path.parent)) return false;

    // TODO: 2nd stage:
    // - return true on known conditions
    return true;

    // - throw error at others
  }

  function bubbleThroughPattern(path) {
    if (path.parentPath.isArrayPattern() && path.parentKey === 'elements') 
      return bubbleThroughPattern(path.parentPath);
    if (path.parentPath.isRestElement() && path.parentKey === 'argument') 
      return bubbleThroughPattern(path.parentPath);
    if (path.parentPath.isObjectPattern() && path.parentKey === 'properties') 
      return bubbleThroughPattern(path.parentPath);
    if (path.parentPath.isObjectProperty() && path.parentKey === 'value') 
      return bubbleThroughPattern(path.parentPath);
    if (path.parentPath.isRestProperty() && path.parentKey === 'argument') 
      return bubbleThroughPattern(path.parentPath);
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
      Program: {
        exit(path, state) {
          const VAR_RECORDER_NAME = state.var_recorder_info.VAR_RECORDER_NAME;
          const MODULE_IDENTIFIER = state.var_recorder_info.MODULE_IDENTIFIER;
          const lazyInitializeModuleScopeTemplate = template(
            `${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER} = ${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER} || {}`);
          const lazyInitializeModuleScope = lazyInitializeModuleScopeTemplate();
          path.unshiftContainer('body', lazyInitializeModuleScope);
        },
        enter(program, state) {
          const file = state.file;
          state.var_recorder_info = {};
          const DOIT_MATCHER = /^workspace(async)?(js)?:/;
          const MODULE_MATCHER = /.js$/;

          let filename = file.log.filename;
          // console.log('visitor!', program, filename);

          const VAR_RECORDER_NAME = '_recorder_' || '__varRecorder__';
          let MODULE_NAME;
          if (window.__topLevelVarRecorder_ModuleNames__ && DOIT_MATCHER.test(filename) 
              && !MODULE_MATCHER.test(
              filename)) {
            // workspace: becomes workspacejs... e.g. and we are only interested in the id ...
            var codeIdAndPath = filename.replace(DOIT_MATCHER, "") 
            // strip path... that we encoded.... 
            var codeId = codeIdAndPath.replace(/\/.*/, "") 

            codeId = codeId + "/" // see bound-eval.js 

            // (A) - filename
            // (B) - code id (per doit?) and a path....

            // TODO the path should be the module in the first place.....

            // why not: MODULE_NAME = codeIdAndPath.replace(/^[\/]*/,"")
            MODULE_NAME = window.__topLevelVarRecorder_ModuleNames__[codeId];
            // console.log("boundEval MODULE_NAME: " + MODULE_NAME + " codeId: " + codeId)
          } else if (!DOIT_MATCHER.test(filename) && MODULE_MATCHER.test(filename)) {
            // eval a .js file
            MODULE_NAME = filename;
          } else {
            throw new Error('Transpiling neither a .js module nor workspace code');
          }
          let MODULE_IDENTIFIER = getScopeIdForModule(MODULE_NAME);
          state.var_recorder_info.VAR_RECORDER_NAME = VAR_RECORDER_NAME;
          state.var_recorder_info.MODULE_IDENTIFIER = MODULE_IDENTIFIER;

          // if(!${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.hasOwnProperty(referenceString)) {
          const varToRecordTemplate = template(
              `
  Object.defineProperty(${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}, referenceString , { 
  get() { return reference; }, 
  set(thisIsVererySecretVariableName) {reference = thisIsVererySecretVariableName; return true }, 
  enumerable: true, 
  configurable: true})
`
// } else {
//   ${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.reference = reference
// }
            ),
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

          // SPLIT UP VARIABLE DECLARATIONS
          let topLevelVariableDeclarations = new Set()
          let topLevelVariableExportDeclarations = new Set()
          for (let binding of Object.values(program.scope.getAllBindings())) {
            var declarationPath = binding.path.parentPath
            if (declarationPath.parent.type == "ExportNamedDeclaration") {
              // #TODO what shall we do with export statements?
              if (declarationPath.node.declarations && declarationPath.node.declarations.length > 0) {
                topLevelVariableExportDeclarations.add(declarationPath) // we need to split them up
              }
            } else if (declarationPath.node.declarations && declarationPath.node.declarations.length > 0) {
              topLevelVariableDeclarations.add(declarationPath) // we need to split them up
            }
          }

          // Rewrite export variable declarations
          for (let declarationPath of Array.from(topLevelVariableExportDeclarations)) {
            var exportDeclaration = declarationPath.parentPath
            declarationPath.node.declarations.forEach(declaration => {
              //               // if(!${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.hasOwnProperty(referenceString)) {
              //               exportDeclaration.insertBefore(template(`export var name`)({ 
              //                 name: declaration.id, referenceString: t.stringLiteral(declaration.id.name) }))


            })
            // insertAfter... will flip the order... so, we do it reverse and then the order will be fine ... fingers crossed! ;-)
            declarationPath.node.declarations.reverse().forEach(declaration => {

              if (declaration.init) {
                exportDeclaration.insertAfter(template(`name = init`)(
                  { name: declaration.id, init: declaration.init }))
                declaration.init = t.identifier("undefined")
              }
            })
            declarationPath.node.kind = "var" // asignments in const are a problem... 

            // exportDeclaration.replaceWith(t.expressionStatement(t.stringLiteral("(var...)"))) // .remove() does not work
          }


          // Rewrite gloabl variable declarations
          for (let declarationPath of Array.from(topLevelVariableDeclarations)) {
            declarationPath.node.declarations.forEach(declaration => {
              // if(!${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.hasOwnProperty(referenceString)) {
              declarationPath.insertBefore(template(`var name`)({
                name: declaration.id,
                referenceString: t.stringLiteral(declaration.id.name)
              }))


            })
            // insertAfter... will flip the order... so, we do it reverse and then the order will be fine ... fingers crossed! ;-)
            declarationPath.node.declarations.reverse().forEach(declaration => {
              if (declaration.init) {
                declarationPath.insertAfter(template(`name = init`)({ name: declaration.id, init: declaration.init }))
              }
            })

            declarationPath.replaceWith(t.expressionStatement(t.stringLiteral("(var...)"))) // .remove() does not work
          }


          let bindings = program.scope.getAllBindings();
          // iterate all module wide bindings
          Object.values(bindings).forEach(binding => {


            function partOfForStatement(binding) {
              const parentPath = binding.path.parentPath;
              const shouldSortOut = binding.path.isVariableDeclarator() &&
                parentPath.isVariableDeclaration() &&
                parentPath.node.kind === "var" && ((
                  (
                    parentPath.parentPath.isForAwaitStatement() ||
                    parentPath.parentPath.isForInStatement() ||
                    parentPath.parentPath.isForOfStatement()
                  ) && parentPath.parentKey === "left"
                ) || (
                  parentPath.parentPath.isForStatement() &&
                  parentPath.parentKey === "init"
                ));
              return shouldSortOut;
            }

            if (partOfForStatement(binding)) {
              // console.error("sort out", binding.identifier.name)
              // console.warn(binding)
              binding.__ignoreRecorder__ = true;
              return;
            } else {
              // console.error("not matching", binding.identifier.name)
              // console.warn(binding)
            }

            binding.referencePaths
              .filter(ref => {
                // ExportNamedDeclarations should not be rewritten as reference
                // they are already rewritten as binding

                if (ref.isExportNamedDeclaration()) {
                  return false;
                }
                // Same for declaring the default export
                if (ref.isExportDefaultDeclaration()) {
                  return false;
                }

                // handle named exports special
                if (ref.parentPath.isExportSpecifier() && ref.parentKey === 'local') {
                  ref
                    .find(path => path.parentPath.isProgram())
                    .insertBefore(recordToVarTemplate({ reference: mark(t.identifier(binding.identifier.name)) }))
                    .forEach(newPath => newPath.skip());
                  ref.skip();
                  return false;
                }

                // ObjectPatterns and ArrayPatterns in VariableDeclarations do not accept MemberExpressions.
                // Thus, we have to filter out these cases explicitly.
                if (ref.findParent(p => p.isPattern()) && ref.findParent(p => p.isDeclaration())) {
                  let pattern = bubbleThroughPattern(ref);
                  if (pattern.parentPath.isVariableDeclarator() && pattern.parentKey === 'id') return false;
                }
                return true;
              })
              .forEach(replaceReference);

            // dealing with the declaration of the binding
            let varToRecord = varToRecordTemplate({ reference: t.identifier(binding.identifier.name),
              referenceString: t.stringLiteral(binding.identifier.name), });

            varToRecord.markedAsMeta = true


            if (binding.kind === 'hoisted' /* || binding.kind === 'module'*/ ) {
              binding.path
                .find(path => path.isProgram())
                .unshiftContainer('body', varToRecord);
            } else {
              // #DesignQuestion
              // a) should we add a guard here and check if the variable was recorded and we are reloaded
              // b) change the semantics of variable declarations to be assigned with "undefined" if first time loaded [as implemented below]
              if (!binding.path.node.init)
                binding.path.node.init = referenceTemplate({
                  reference: t.identifier(binding.identifier.name)
                }).expression;
              binding.path
                .getStatementParent()
                .insertAfter(varToRecord)
                .forEach(newPath => newPath.skip());
            }
          });

          program.traverse({
            Identifier(path) {

              if (isMarked(path.node)) return;
              if (!isVariable(path)) return;

              // special case of assigning to a reference
              let pattern = bubbleThroughPattern(path);
              if (pattern.parentPath.isAssignmentExpression() && pattern.parentKey === 'left') {
                let par = path.find(parent => parent.scope.hasOwnBinding(path.node.name));
                // is our binding scope the module-wide scope?
                if (par && par.scope === program.scope) {

                  // is it part of a for in declaration
                  const binding = par.scope.getOwnBinding(path.node.name)
                  if (binding && binding.__ignoreRecorder__) { return; }

                  if (!path.find(p => p.node.markedAsMeta)) {
                    replaceReference(path);
                  }

                  return path.skip();
                }
              }

              // Distinguish between module-bound variables and real globals
              if (
                path.scope.hasGlobal(path.node.name) &&
                moduleBoundGlobals.includes(path.node.name)
              ) {
                replaceReference(path);
                return path.skip();
              }
            }
          });
        }
      },
    }
  };

}
