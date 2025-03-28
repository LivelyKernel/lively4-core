const IS_EXPLICIT_SCOPE_OBJECT = Symbol('FLAG: generated scope object');

export default function({ types: t, template, traverse, }) {
    var setup = template(`
const signals = [],
    defineSignal = function(scope, name, init) {
      let signal = new Signal(scope, name, init);
      signals.push(signal);
      return signal.initialize();
    },
    resolveSignals = function() {
      signals.forEach(s => s.initialize());
    },
    getLocal = function(scope, name) {
      if(Signal.determineDepencencies) {
        Signal.currentSignal.addDependency(scope, name);
      }
    },
    setLocal = function(scope, name) {
      if(Signal.solving) { return; }
      let triggeredSignal = signals.find(s => s.hasDependency(scope, name));
      if(triggeredSignal) {
        resolveSignals();
      }
    };

const compositeKeyStore = new Map();

class Signal {
  constructor(scope, name, init) {
    this.scope = scope,
    this.name = name,
    this.init = init;
    this.dependencies = new Set();
  }
  initialize() {
    this.dependencies.clear();
    Signal.determineDepencencies = true;
    Signal.currentSignal = this;
    let result = this.init();
    Signal.determineDepencencies = false;
    Signal.currentSignal = undefined;
    return result;
  }
  addDependency(scope, name) {
    this.dependencies.add(CompositeKey.get(scope, name));
  }
  hasDependency(scope, name) {
    return this.dependencies.has(CompositeKey.get(scope, name));
  }
}
Signal.currentSignal = undefined;
Signal.determineDepencencies = false;
Signal.solving = false;

class CompositeKey {
    static get(obj1, obj2) {
        if(!compositeKeyStore.has(obj1)) {
            compositeKeyStore.set(obj1, new Map());
        }
        let secondKeyMap = compositeKeyStore.get(obj1);
        if(!secondKeyMap.has(obj2)) {
            secondKeyMap.set(obj2, {});
        }
        return secondKeyMap.get(obj2);
    }
    static clear() {
        compositeKeyStore.clear();
    }
}`);
    
    return {
        visitor: {
            Program(program, state) {
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
                  if(t.isMemberExpression(path.parent) && path.parentKey === 'property' && !path.parent.computed) return false;
                  if(t.isObjectMethod(path.parent)) return false;
                  if(t.isFunctionDeclaration(path.parent)) return false;
                  if((t.isArrowFunctionExpression(path.parent) && path.parentKey === 'params')) return false;
                  if((t.isFunctionExpression(path.parent) && path.parentKey === 'params')) return false;
                  if(t.isRestElement(path.parent)) return false;
              
                  return true;
                }

                function getIdentifierForExplicitScopeObject(parentWithScope) {
                    let bindings = parentWithScope.scope.bindings;
                    let scopeName = Object.keys(bindings).find(key => {
                        return bindings[key].path &&
                            bindings[key].path.node &&
                            bindings[key].path.node.id &&
                            bindings[key].path.node.id[IS_EXPLICIT_SCOPE_OBJECT]
                    });

                    if(scopeName) {
                        return t.identifier(scopeName);
                    } else {
                        let uniqueIdentifier = parentWithScope.scope.generateUidIdentifier('scope');
                        uniqueIdentifier[IS_EXPLICIT_SCOPE_OBJECT] = true;

                        parentWithScope.scope.push({
                            kind: 'let',
                            id: uniqueIdentifier,
                            init: t.objectExpression([
                              t.objectProperty(t.identifier('name'), t.stringLiteral(uniqueIdentifier.name))
                            ])
                        });
                        return uniqueIdentifier;
                    }
                }

                function getScopeIdentifierForVariable(path) {
                    if(path.scope.hasBinding(path.node.name)) {
                        let parentWithScope = path.findParent(par =>
                            par.scope.hasOwnBinding(path.node.name)
                        );
                        if(parentWithScope) {
                            return getIdentifierForExplicitScopeObject(parentWithScope);
                        }
                    } else {
                        return t.identifier('window');
                    }
                }
                
                function bubbleThroughPattern(path) {
                  if(path.parentPath.isArrayPattern() && path.parentKey === 'elements') return bubbleThroughPattern(path.parentPath);
                  if(path.parentPath.isRestElement() && path.parentKey === 'argument') return bubbleThroughPattern(path.parentPath);
                  if(path.parentPath.isObjectPattern() && path.parentKey === 'properties') return bubbleThroughPattern(path.parentPath);
                  if(path.parentPath.isObjectProperty() && path.parentKey === 'value') return bubbleThroughPattern(path.parentPath);
                  if(path.parentPath.isRestProperty() && path.parentKey === 'argument') return bubbleThroughPattern(path.parentPath);
                  return path;
                }
                
                function isLocallyDefined(path) {
                  return path.scope.hasBinding(path.node.name) && path.findParent(par =>
                    par.scope.hasOwnBinding(path.node.name)
                  );
                }
                
                function identifierInDeclaration(identifierPath) {
                  if(!identifierPath.findParent(p=>p.isDeclaration())) { return false; }
                  let pattern = bubbleThroughPattern(identifierPath);
                  return pattern.parentPath.isVariableDeclarator() && pattern.parentKey === 'id';
                }
                
                program.traverse({
                  UpdateExpression(path) {
                    path.replaceWith(t.binaryExpression(
                      path.node.operator === '++' ? '-' : '+',
                      t.assignmentExpression(
                        path.node.operator === '++' ? '+=' : '-=',
                        path.get('argument').node,
                        t.numberLiteral(1)
                      ),
                      t.numberLiteral(1)
                    ));
                  }
                });

                let localReads = new Set();
                let globalReads = new Set();
                let localWrites = new Set();
                let signalDeclarators = new Set();
                let objPropReads = new Set();
                let objPropWrites = new Set();
                let objPropCalls = new Set();
                
                program.traverse({
                  MemberExpression(path) {
                    if(path.parentPath.isAssignmentExpression() && path.parentKey === 'left') {
                      objPropWrites.add(path);
                    } else if(path.parentPath.isCallExpression() && path.parentKey === 'callee') {
                      objPropCalls.add(path);
                    } else {
                      objPropReads.add(path);
                    }
                  }
                });
                
                program.traverse({
                  Identifier(path) {
                    if(path.parentPath.isAssignmentExpression() && path.parentKey === 'left') {
                      localWrites.add(path);
                    } else if (isVariable(path) && isLocallyDefined(path) && !identifierInDeclaration(path)){
                      localReads.add(path);
                    } else if (isVariable(path) && isLocallyDefined(path)) {
                      let pattern = bubbleThroughPattern(path);
                      // const as substitute for 'signal' for now #TODO
                      if(pattern.parentPath.parentPath.node.kind === 'const') {
                        signalDeclarators.add(pattern.parentPath);
                      }
                    } else if(isVariable(path) && !isLocallyDefined(path)) {
                      globalReads.add(path);
                    }
                  }
                });
                
                let rewriteGetter = path => {
                  path.replaceWith(template(`((result, scope, name) => {
                      getLocal(scope, name);
                      return result;
                    })(IDENTIFIER, SCOPE, NAME)`)({
                      IDENTIFIER: path.node,
                      SCOPE: getScopeIdentifierForVariable(path),
                      NAME: t.stringLiteral(path.node.name)
                    }));
                };
                globalReads.forEach(rewriteGetter);
                localReads.forEach(rewriteGetter);
                
                signalDeclarators.forEach(decl => {
                  decl.parentPath.node.kind = 'let';
                  let init = decl.get('init'),
                      id = decl.get('id');
                  init.replaceWith(template(`defineSignal(SCOPE, NAME, () => INIT)`)({
                    SCOPE: getScopeIdentifierForVariable(id),
                    NAME: t.stringLiteral(id.node.name),
                    INIT: init
                  }));
                })

                localWrites.forEach(path => {
                  let assignment = path.parentPath;
                  assignment.replaceWith(
                    template(`((result, scope, name) => {
                      setLocal(scope, name);
                      return result;
                    })(ASSIGNMENT, SCOPE, NAME)`)({
                      ASSIGNMENT: assignment.node,
                      SCOPE: getScopeIdentifierForVariable(path),
                      NAME: t.stringLiteral(path.node.name)
                    })
                  );
                });
                
                objPropReads.forEach(p => {
                  program.unshiftContainer('body', t.expressionStatement(t.stringLiteral(p.node.property.name)));
                })
                objPropReads.forEach(path => {
                  let obj = path.get('object'),
                      prop = path.get('property'),
                      computed = path.node.computed;
                  path.replaceWith(template(`((obj, prop) => {
                      getLocal(obj, prop);
                      return obj[prop];
                    })(OBJECT, PROP_NAME)`)({
                      OBJECT: obj.node,
                      PROP_NAME: computed ? prop.node : t.stringLiteral(prop.node.name)
                    }));
                });
                objPropWrites.forEach(path => {
                  let assignment = path.parentPath;
                  let operator = assignment.node.operator;
                  let obj = path.get('object'),
                      prop = path.get('property'),
                      computed = path.node.computed;
                  assignment.replaceWith(
                    template(`((obj, prop, value) => {
                      let result = obj[prop] ${operator} value;
                      setLocal(obj, prop);
                      return result;
                    })(OBJECT, PROP_NAME, VALUE)`)({
                      OBJECT: obj.node,
                      PROP_NAME: computed ? prop.node : t.stringLiteral(prop.node.name),
                      VALUE: assignment.node.right
                    })
                  );
                });
                objPropCalls.forEach(path => {
                  let obj = path.get('object'),
                      prop = path.get('property'),
                      computed = path.node.computed;
                  path.replaceWith(template(`((obj, prop, ) => {
                      getLocal(obj, prop);
                      return obj[prop].bind(obj);
                    })(OBJECT, PROP_NAME)`)({
                      OBJECT: obj.node,
                      PROP_NAME: computed ? prop.node : t.stringLiteral(prop.node.name)
                    }));
                });

                program.unshiftContainer("body", setup());
            }
        }
    };
}