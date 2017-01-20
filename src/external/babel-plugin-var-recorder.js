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
    if(t.isVariableDeclarator(path.parent)) return false;
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

  const VAR_RECORDER_NAME = window.__topLevelVarRecorderName__ || '_recorder_' || '__varRecorder__',
        MODULE_IDENTIFIER = window.__topLevelVarRecorder_ModuleName__ || '_module_' || '__defaultModule__',
        varToRecordTemplate = template(`${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.reference = reference`),
        recordToVarTemplate = template(`reference = ${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.reference`),
        referenceTemplate = template(`${VAR_RECORDER_NAME}.${MODULE_IDENTIFIER}.reference`);

  function replaceReference(ref) {
    ref.replaceWith(referenceTemplate({ reference: ref.node }).expression);
    ref.skip();
  }
  
  function log(path, pre) {
    if(path.node.name !== 'glob5') return;
    return logIdentifier(path, pre);
  }
  
  function logIdentifier(path, pre = '') {
    console.log(pre + `${path.node.name} in ${path.parentPath.node.type} as ${path.key}`);
  }
  
  function logBinding(binding, pre = '') {
    console.log(pre + `${binding.identifier.name}`);
  }
  
  return {
    name: "top-level-var-recorder",
    pre() {
      console.clear();
      this.moduleBoundGlobals = Object.keys(window[VAR_RECORDER_NAME][MODULE_IDENTIFIER]);
      console.log('bound names:', ...this.moduleBoundGlobals);
    },
    visitor: {
      Program(program) {
        let bindings = program.scope.getAllBindings();

        // iterate all module wide bindings
        Object.values(bindings).forEach(binding => {
          binding.referencePaths
            .filter(ref => {
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
            .forEach(replaceReference)

          binding.path
            .find(path => path.parentPath.isProgram())
            .insertAfter(varToRecordTemplate({ reference: t.identifier(binding.identifier.name) }))
            .forEach(newPath => newPath.skip());
        });
    
        // special case of assigning to a reference
        program.traverse({
          Identifier(path) {
            if(isMarked(path.node)) return;
            if(!isVariable(path)) return;
            let pattern = bubbleThroughPattern(path);
            if(pattern.parentPath.isAssignmentExpression() && pattern.parentKey === 'left') {
              let par = path.find(parent => parent.scope.hasOwnBinding(path.node.name));
              // is our binding scope the module-wide scope?
              if(par && par.scope === program.scope) {
                replaceReference(path);
                return path.skip();
              }
            }
          }
        });
      },
      Identifier(path) {
        logIdentifier(path, 'visited identifier ')
        if(isMarked(path.node)) return;
        if(!isVariable(path)) return;
        // Distinguish between module-bound variables and real globals
        if(!path.scope.hasGlobal(path.node.name)) return;
        if(!this.moduleBoundGlobals.includes(path.node.name)) return;
        replaceReference(path);
        return path.skip();
      }
    }
  };
}
