import { isVariable } from './utils.js';
import Preferences from 'src/client/preferences.js';
import {addNamed} from 'src/external/babel/babel7-helpers.js';


//import 'src/client/js-beautify/beautify.js'

const AEXPR_IDENTIFIER_NAME = 'aexpr';
const AEXPR_SHORTHAND_NAME = 'ae';

const GET_MEMBER = 'getMember';
const GET_AND_CALL_MEMBER = 'getAndCallMember';

const TRACE_MEMBER = 'traceMember';

const SET_MEMBER_BY_OPERATORS = {
  '=': 'setMember',
  '+=': 'setMemberAddition',
  '-=': 'setMemberSubtraction',
  '*=': 'setMemberMultiplication',
  '/=': 'setMemberDivision',
  '%=': 'setMemberRemainder',
  '**=': 'setMemberExponentiation',
  '<<=': 'setMemberLeftShift',
  '>>=': 'setMemberRightShift',
  '>>>=': 'setMemberUnsignedRightShift',
  '&=': 'setMemberBitwiseAND',
  '^=': 'setMemberBitwiseXOR',
  '|=': 'setMemberBitwiseOR'
};

const DELETE_MEMBER = 'deleteMember';

const SET_LOCAL = 'setLocal';
const GET_LOCAL = 'getLocal';

const SET_GLOBAL = 'setGlobal';
const GET_GLOBAL = 'getGlobal';

const IGNORE_STRING = 'aexpr ignore';
const IGNORE_INDICATOR = Symbol('aexpr ignore');

// TODO: use multiple flag for indication of generated content, marking explicit scopes, etc.
export const FLAG_GENERATED_SCOPE_OBJECT = Symbol('FLAG: generated scope object');
export const FLAG_SHOULD_NOT_REWRITE_IDENTIFIER = Symbol('FLAG: should not rewrite identifier');
export const FLAG_SHOULD_NOT_REWRITE_MEMBER_EXPRESSION = Symbol('FLAG: should not rewrite member expression');
export const FLAG_SHOULD_NOT_REWRITE_CALL_EXPRESSION = Symbol('FLAG: should not rewrite call expression');
export const FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION = Symbol('FLAG: should not rewrite assignment expression');

function markMemberToNotBeRewritten(path) {
  path[FLAG_SHOULD_NOT_REWRITE_MEMBER_EXPRESSION] = true;
  return path;
}

export function getSourceLocation(node, state, template, t) {
  let fileName = state && state.file && state.file.opts && state.file.opts.filename || 'no_file_given';
  if (fileName.startsWith('workspace:') && fileName.includes('unnamed_module_')) {
    fileName = 'workspace:' + fileName.split('unnamed_module_')[1];
  }
  if (!node.loc) {

    console.error("Make sure to add loc information manually when inserting an AE or assignment while transforming" + node.left.name + " = " + node.right.name);
    return t.identifier("undefined");
  }
  if (node.loc === "sourceless") {
    return t.identifier("undefined");
  }

  const sourceLocation = template(`({
    file: '${fileName}',
    end: {
      column: END_COLUMN,
      line: END_LINE
    },
    start: {
      column: START_COLUMN,
      line: START_LINE
    },
    source: ''
  })`);

  // let source = babel.transformFromAst(wrapper, {sourceType: 'module'}).code;
  return sourceLocation({
    END_COLUMN: t.numericLiteral(node.loc.end.column),
    END_LINE: t.numericLiteral(node.loc.end.line),
    START_COLUMN: t.numericLiteral(node.loc.start.column),
    START_LINE: t.numericLiteral(node.loc.start.line
    // SOURCE: source
    ) }).expression;
}

export default function (babel) {
  let { types: t, template, traverse } = babel;

  function getPropertyFromMemberExpression(node) {
    // We are looking for MemberExpressions, which have two distinct incarnations:
    // 1. we have a computed MemberExpression like a[b], with the property being an Expression
    // 2. a non-computed MemberExpression like a.b, with the property being an Identifier
    return node.computed ?
    // We can easily deal with the first case by replacing the MemberExpression with a call
    node.property :
    // In the second case, we introduce a StringLiteral matching the Identifier
    t.stringLiteral(node.property.name);
  }

  const GENERATED_FUNCTION = Symbol("generated function");

  function isGenerated(path) {
    return path.findParent(p => t.isFunctionDeclaration(p.node) && p.node[GENERATED_FUNCTION]);
  }

  const tNonRewritable = new Proxy({}, {
    get(target, prop, receiver) {
      return (...args) => {
        const node = t[prop](...args);
        // --> #TODO: should use a common 'doNotRewriteNode' and 'doNotRewriteSubtree' flags
        node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
        return node;
      };
    }
  });

  function nonRewritableIdentifier(name) {
    return tNonRewritable.identifier(name);
    const node = t.identifier(name);
    node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
    return node;
  }

  const GENERATED_IMPORT_IDENTIFIER = Symbol("generated import identifier");

  //     let customTemplates = {};
  //     customTemplates[SET_MEMBER] = template(`
  //   (function(obj, prop, operator, val) {
  //     return obj[prop] = val;
  //   });
  // `);
  //
  //     customTemplates[GET_MEMBER] = template(`
  //   (function(obj, prop) {
  //     return obj[prop];
  //   });
  // `);
  //
  //     customTemplates[GET_AND_CALL_MEMBER] = template(`
  //   (function(obj, prop, args) {
  //     return obj[prop](...args)
  //   });
  // `);
  //
  //     customTemplates[AEXPR_IDENTIFIER_NAME] = template(`
  //   (function(expr) {
  //     return { onChange(cb) {}};
  //   });
  // `);

  function addCustomTemplate(file, name, path) {
    // console.log("addCustomTemplate " + name , path)
    if (!path) {
      debugger
      throw new Error("path argument missing")
    }
    
    
    const declar = file.declarations[name];
    if (declar) {
      return declar;
    }

    // const identifier = file.declarations[name] = file.addImport("active-expression-rewriting", name, name);
    let identifier = file.declarations[name] = addNamed(path, name, "active-expression-rewriting", {nameHint: name});
    
    identifier[GENERATED_IMPORT_IDENTIFIER] = true;
    identifier[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
    return identifier;

    // let ref = customTemplates[name];
    // console.log(file.addImport("active-expression-rewriting", "aexpr"));
    // let uid = file.declarations[name] = file.scope.generateUidIdentifier(name);
    //
    // ref = ref().expression;
    // ref[GENERATED_FUNCTION] = true;
    //
    // if (t.isFunctionExpression(ref) && !ref.id) {
    //     ref.body._compact = true;
    //     ref._generated = true;
    //     ref.id = uid;
    //     ref.type = "FunctionDeclaration";
    //     file.path.unshiftContainer("body", ref);
    // } else {
    //     ref._compact = true;
    //     file.scope.push({
    //         id: uid,
    //         init: ref,
    //         unique: true
    //     });
    // }
    //
    // return uid;
  }

  // #TODO: add global flag for expression analysis mode
  function checkExpressionAnalysisMode(node) {
    return t.ifStatement(markMemberToNotBeRewritten(t.memberExpression(nonRewritableIdentifier('self'), nonRewritableIdentifier('__expressionAnalysisMode__'))), t.expressionStatement(node
    // ,t.unaryExpression("void", t.numericLiteral(0), true)
    ));
  }

  function isInForLoopIterator(path) {
    const isInForLoop = path.find(p => {
      if (!p.parentPath) return false;
      if (p.parentPath.isForStatement() && ['init', 'test', 'update'].includes(p.parentKey)) return true;
      if (p.parentPath.isForInStatement() && p.parentKey === 'left') return true;
      if (p.parentPath.isForOfStatement() && p.parentKey === 'left') return true;
      return false;
    });
    return !!isInForLoop;
  }

  function isInDestructuringAssignment(path) {

    
    const patternParent = path.find(p => {
      if (!p.isPattern()) {
        return false;
      }
      if (!p.parentPath) {
        return false;
      }

      const inVarDefinition = p.parentPath.isVariableDeclarator() && p.parentKey === 'id';
      const inAssignment = p.parentPath.isAssignmentExpression() && p.parentKey === 'left';
      const inParams = p.parentPath.isFunction() && p.parentKey === 'params';
      return inVarDefinition || inAssignment || inParams;
    });
    return !!patternParent;
  }

  return {
    pre(file) {
      //console.log("fff", file, traverse);
    },
    name: 'active-expression-rewriting',
    visitor: {
      Program: {
        enter(path, state) {
          function hasDirective(path, name) {
            let foundDirective = false;
            path.traverse({
              Directive(path) {
                if (path.get("value").node.value === name) {
                  foundDirective = true;
                }
              }
            });
            return foundDirective;
          }

          function shouldTransform() {
            const proxyDirective = hasDirective(path, 'use proxies for aexprs');
            const proxyPreference = Preferences.get('UseProxiesForAExprs');
            const inWorkspace = state.opts.executedIn === 'workspace';
            const inFile = state.opts.executedIn === 'file';

            if (inWorkspace) {
              return !proxyPreference;
            } else if (inFile) {
              return !proxyDirective;
            }
            return true;
            throw new Error('This should not be possible');
          }

          if (!shouldTransform()) {
            return;
          }

          if (state.opts.enableViaDirective && !hasDirective(path, "enable aexpr")) {
            return;
          }

          function getIdentifierForExplicitScopeObject(parentWithScope) {
            let bindings = parentWithScope.scope.bindings;
            

            let scopeName = Object.keys(bindings).find(key => {
              return bindings[key].path && bindings[key].path.node && bindings[key].path.node.id && bindings[key].path.node.id[FLAG_GENERATED_SCOPE_OBJECT]; // should actually be IS_EXPLICIT_SCOPE_OBJECT
            });

            let uniqueIdentifier;
            if (scopeName) {
              uniqueIdentifier = t.identifier(scopeName);
            } else {
              uniqueIdentifier = parentWithScope.scope.generateUidIdentifier('scope');
              uniqueIdentifier[FLAG_GENERATED_SCOPE_OBJECT] = true;

              parentWithScope.scope.push({
                kind: 'let',
                id: uniqueIdentifier,
                init: t.objectExpression([t.objectProperty(t.identifier("isScope"), t.booleanLiteral(true))])
              });
            }
            uniqueIdentifier[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
            return uniqueIdentifier;
          }

          function rewriteReadGlobal(path) {
            if (path.node.name !== 'eval') {
              path.node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
              prependGetGlobal(path);
            }
          }
          function prependGetGlobal(path) {
            path.insertBefore(checkExpressionAnalysisMode(t.callExpression(addCustomTemplate(state.file, GET_GLOBAL, path), [t.stringLiteral(path.node.name)])));
          }
          function wrapSetGlobal(path) {
            const valueToReturn = t.identifier(path.node.left.name);
            valueToReturn[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
            
            const parameters = [t.stringLiteral(path.node.left.name)];
            if(Preferences.get("EnableAEDebugging")) {
              parameters.push(getSourceLocation(path.node, state, template, t));
            }
            
            path.replaceWith(t.sequenceExpression([path.node, t.callExpression(addCustomTemplate(state.file, SET_GLOBAL, path), parameters), valueToReturn]));
          }
          function setClassFilePathStatement() {
            let fileName = state && state.file && state.file.opts && state.file.opts.filename || 'no_file_given';
            if (fileName.startsWith('workspace:') && fileName.includes('unnamed_module_')) {
              fileName = 'workspace:' + fileName.split('unnamed_module_')[1];
            }
            const assignmentExpression = t.assignmentExpression("=", t.memberExpression(t.thisExpression(), t.identifier("__classFilePath__")), t.stringLiteral(fileName));
            assignmentExpression.loc = "sourceless";

            return t.expressionStatement(assignmentExpression);
          }

          function isClassFilePathStatement(statement) {
            if (!t.isExpressionStatement(statement)) return false;
            if (t.isAssignmentExpression(statement.expression)) {
              return t.isMemberExpression(statement.expression.left) && t.isIdentifier(statement.expression.left.property) && statement.expression.left.property.name === "__classFilePath__";
            } else if (t.isCallExpression(statement.expression)) {
              return statement.expression.arguments.length >= 2 && statement.expression.arguments[1].value === "__classFilePath__";
            }
            return false;
          }

          // ------------- ensureBlock -------------
          const maybeWrapInStatement = (node, wrapInReturnStatement) => {
            if (t.isStatement(node)) {
              return node;
            } else if (t.isExpression(node)) {
              // wrap in return statement if we have an arrow function: () => 42 -> () => { return 42; }
              const expressionNode = wrapInReturnStatement ? t.returnStatement(node) : t.expressionStatement(node);
              expressionNode.loc = node.loc;
              return expressionNode;
            } else {
              console.error("Tried to wrap something unknown:", node);
              return node;
            }
          };
          const wrapPropertyOfPath = (path, property) => {
            const oldBody = path.get(property);
            const oldBodyNode = path.node[property];
            if (!oldBodyNode) {
              return;
            }
            if (oldBody.isBlockStatement && oldBody.isBlockStatement()) {
              // This is already a block
              return;
            } else if (oldBody instanceof Array) {
              const newBodyNode = t.blockStatement(oldBodyNode);
              path.node[property] = [newBodyNode];
            } else {
              const newBodyNode = t.blockStatement([maybeWrapInStatement(oldBodyNode, path.isArrowFunctionExpression())]);
              oldBody.replaceWith(newBodyNode);
            }
            return path;
          };
          let hasInitialize = false;
          path.traverse({
            BlockParent(path) {
              if (path.isProgram() || path.isBlockStatement() || path.isSwitchStatement()) {
                return;
              }
              if (!path.node.body) {
                console.warn("A BlockParent without body: ", path);
              }

              wrapPropertyOfPath(path, "body");
            },
            IfStatement(path) {
              for (let property of ["consequent", "alternate"]) {
                wrapPropertyOfPath(path, property);
              }
            },
            SwitchCase(path) {
              wrapPropertyOfPath(path, "consequent");
            },
            ClassMethod(path) {
              if (path.node.key.name === "initialize") {
                hasInitialize = true;
              }
            }
          });

          path.traverse({

            UnaryExpression(path) {
              if (isInForLoopIterator(path)) {
                return;
              }
              if (isInDestructuringAssignment(path)) {
                return;
              }

              // handle delete operator
              if (path.node.operator === 'delete') {
                const argument = path.get('argument');
                if (argument.isMemberExpression()) {
                  path.replaceWith(t.callExpression(addCustomTemplate(state.file, DELETE_MEMBER, path), [argument.node.object, getPropertyFromMemberExpression(argument.node)]));
                }
                return;
              }
            },

            UpdateExpression(path) {
              const operator = path.node.operator;
              const prefix = path.node.prefix;
              const argument = path.get('argument');
              if (isInForLoopIterator(path)) {
                return;
              }
              if (isInDestructuringAssignment(path)) {
                return;
              }

              if (argument.isMemberExpression() || argument.isIdentifier()) {

                // ++v -> v += 1
                let assignment = t.assignmentExpression(operator[0] + '=', argument.node, t.numericLiteral(1));
                assignment.loc = path.node.loc;

                if (!prefix) {
                  // need to modify result for postfix operators
                  // v++ -> (v += 1) - 1
                  const reverseOperator = operator[0] === '+' ? '-' : '+';
                  assignment = t.binaryExpression(reverseOperator, assignment, t.numericLiteral(1));
                  assignment.loc = path.node.loc;
                }
                path.replaceWith(assignment);
              }
            },

            ClassMethod(path) {
              if (hasInitialize ? path.node.key.name !== "initialize" : path.node.kind !== "constructor") return;
              const bodyStatements = path.node.body.body;
              const lastStatement = bodyStatements[bodyStatements.length - 1];
              if (bodyStatements.length === 0 || !isClassFilePathStatement(lastStatement)) {
                path.get('body').pushContainer('body', setClassFilePathStatement());
              }
            },

            ClassDeclaration(path) {
              if (hasInitialize) return;
              const classBody = path.node.body;
              if (!classBody.body.some(classElement => t.isClassMethod(classElement) && classElement.kind === "constructor")) {
                // No constructor exists -> Override default constructor
                const constructorContent = [];
                if (path.node.superClass) {
                  constructorContent.push(t.expressionStatement(t.callExpression(t.super(), [t.spreadElement(t.identifier("args"))])));
                }
                constructorContent.push(setClassFilePathStatement());
                path.get("body").unshiftContainer("body", t.classMethod("constructor", t.identifier("constructor"), [t.restElement(t.identifier("args"))], t.blockStatement(constructorContent)));
              }
            },
            /*MD # Identifier MD*/
            Identifier(path) {
              //console.log(path.node.name);

              
              function logIdentifier(msg, path) {
                console.log(msg, path.node.name, path.node.loc ? path.node.loc.start.line : '');
              }

              if (path.node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER]) {
                return;
              }

              function addAsObjectPropertyAsSecondParameter(functionCallPath, propertyName, node) {
                
                const args = functionCallPath.get('arguments');

                /* #TODO: Support the following cases:
                 * ae(expr)
                 * ae(expr, { })
                 * ae(expr, obj)
                 * ae(expr, ...arr)
                 * ae(...arr)
                 */
                if (args.some(any => any.isSpreadElement())) {
                  return;
                }

                if (args.length === 0) {
                  return;
                }

                if (args.length === 1) {
                  functionCallPath.pushContainer('arguments', t.objectExpression([t.objectProperty(t.identifier(propertyName), node)]));
                  return;
                }

                const argument = args[1];
                if (argument.isObjectExpression()) {
                  argument.pushContainer('properties', t.objectProperty(t.identifier(propertyName), node));
                } else {
                  const assign = template(`Object.assign({${propertyName} : PROPERTY}, EXPR || {})`);
                
                  const assigned = assign({ PROPERTY: node, EXPR: argument.node }).expression;
                  
                  argument.replaceWith(assigned);
                }
              }
              
              function formatCode(source) {
                //Seems like this is too big to import properly
                //System.import("src/client/js-beautify/beautify.js")
                //debugger;
                //return global.js_beautify(source);
                return source;
              }

              function addOriginalSourceCode(aexprIdentifierPath) {
                const args = aexprIdentifierPath.parentPath.get('arguments');
                if (args.length === 0) {
                  return;
                }
                const expressionPath = args[0];
                const sourceCode = expressionPath.getSource();
                
                const formattedCode = formatCode(sourceCode);
                
                if (sourceCode) {
                  addAsObjectPropertyAsSecondParameter(aexprIdentifierPath.parentPath, 'sourceCode', t.stringLiteral(formattedCode));
                }
              }

              function addSourceMetaData(path) {
                if(!Preferences.get("EnableAEDebugging")) {
                  return;
                }
                const location = getSourceLocation(path.node, state, template, t);
                addAsObjectPropertyAsSecondParameter(path.parentPath, 'location', location);
                addOriginalSourceCode(path);
              }

              const isCallee = t.isCallExpression(path.parent) && path.parentKey === 'callee';
              function hasUnboundName(name) {
                // #TODO: in workspaces, this might lead to an issue, as we may override
                // a module-global variable that was declared in an earlier execution
                return path.node.name === name && !path.scope.hasBinding(name);
              }

              // Check for a call to undeclared `aexpr`:
              if (isCallee && hasUnboundName(AEXPR_IDENTIFIER_NAME)) {
                addSourceMetaData(path);

                path.replaceWith(addCustomTemplate(state.file, AEXPR_IDENTIFIER_NAME, path));
                return;
              }

              // Check for a call to undeclared `ae`:
              if (isCallee && hasUnboundName(AEXPR_SHORTHAND_NAME)) {
                addSourceMetaData(path);

                const expressionPath = path.parentPath.get('arguments')[0];
                if (expressionPath) {
                  expressionPath.replaceWith(t.arrowFunctionExpression([], expressionPath.node));
                }

                path.replaceWith(addCustomTemplate(state.file, AEXPR_IDENTIFIER_NAME, path));
                return;
              }

              // property local of ExportStatement
              if (t.isExportSpecifier(path.parent) && path.parentKey === 'local') {
                return;
              }

              if (
              // TODO: is there a general way to exclude non-variables?
              isVariable(path) && !t.isMetaProperty(path.parent) && !(t.isForInStatement(path.parent) && path.parentKey === 'left') && !(t.isAssignmentPattern(path.parent) && path.parentKey === 'left') && !t.isUpdateExpression(path.parent) && !(t.isFunctionExpression(path.parent) && path.parentKey === 'id') && !(t.isImportDefaultSpecifier(path.parent) && path.parentKey === 'local') && !(t.isCatchClause(path.parent) && path.parentKey === 'param') && !(t.isContinueStatement(path.parent) && path.parentKey === 'label') && !t.isObjectProperty(path.parent) && !t.isClassDeclaration(path.parent) && !t.isClassExpression(path.parent) && !t.isClassMethod(path.parent) && !t.isImportSpecifier(path.parent) && !t.isObjectMethod(path.parent) && !(t.isVariableDeclarator(path.parent) && path.parentKey === 'id') && !t.isFunctionDeclaration(path.parent) && !(t.isArrowFunctionExpression(path.parent) && path.parentKey === 'params') && !(t.isExportSpecifier(path.parent) && path.parentKey === 'exported') && !(t.isFunctionExpression(path.parent) && path.parentKey === 'params') && !t.isRestElement(path.parent) && (!t.isAssignmentExpression(path.parent) || !(path.parentKey === 'left')) && (!t.isClassProperty(path.parent) || !(path.parentKey === 'key')) && (!t.isOptionalMemberExpression(path.parent) || !(path.parentKey === 'property'))) {
                if (isInForLoopIterator(path)) {
                  return;
                }
                if (isInDestructuringAssignment(path)) {
                  return;
                }

                if (path.scope.hasBinding(path.node.name)) {
                  //logIdentifier('get local var', path)
                  path.node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;

                  let parentWithScope = path.findParent(par => par.scope.hasOwnBinding(path.node.name));
                  if (parentWithScope) {
                    //function printParents(path) {
                    //  let result = [path.type];
                    //  path.findParent(p => {
                    //    result.push(p.type);
                    //    return false;
                    //  });
                    //  console.log(result.join('\n\r'))
                    //}
                    //printParents(path);
                    //const node = path.parentPath.parentPath;
                    //                                    const statement = path.getStatementParent();
                    //                                      console.warn(statement, statement.type);
                    //node.unshiftContainer('body', t.expressionStatement(t.stringLiteral("HELLO!?")));
                    // lively.openInspector(statement);
                    //statement.insertBefore(t.expressionStatement(t.stringLiteral("WORLD")))
                    //printParents(path.getStatementParent())
                    //printParents(path.getFunctionParent())
                    //path.getFunctionParent().ensureBlock();
                    //path.insertBefore(t.expressionStatement(t.stringLiteral("Because I'm easy come, easy go.")));

                    // #TODO: we cannot ignore non-changing values, as the ae might be configured to e.g. match:shallow
                    // then, a local might still be considered to have changed w/o 
                    // const varBinding = path.scope.getBinding(path.node.name);
                    // const isConst = varBinding.kind === "const";
                    // const isNotChanging = varBinding.constantViolations.length === 0;
                    // if (!isConst && !isNotChanging) {
                    
                    
                    let trackingCode = checkExpressionAnalysisMode(t.callExpression(addCustomTemplate(state.file, GET_LOCAL, path), [getIdentifierForExplicitScopeObject(parentWithScope), t.stringLiteral(path.node.name), nonRewritableIdentifier(path.node.name)]));
                    const isConstant = path.scope.getBinding(path.node.name).constantViolations.length === 0;
                    if(isConstant) {
                      
                      let scopeHasEval = false;
                      path.scope.getBinding(path.node.name).scope.path.traverse({
                        CallExpression(path) {
                          if (t.isIdentifier(path.node.callee) && path.node.callee.name === "eval") {
                            scopeHasEval = true;
                          }
                        }
                      });
                      if(!scopeHasEval) {
                        //If a variable is constant and primitive, we never have to track it, since changing it cannot influence any AEs. So this adds the primitive check at runtime.
                        const objectIdentifier = t.identifier("Object");
                        objectIdentifier[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
                        trackingCode = t.ifStatement(t.binaryExpression("===", path.node, t.callExpression(objectIdentifier, [path.node])), trackingCode, t.expressionStatement(path.node));          
                      }
                    }
                    path.insertBefore(trackingCode);
                    // }
                  } else if (path.scope.hasGlobal(path.node.name)) {
                    // #TODO: remove this code duplication
                    rewriteReadGlobal(path);
                  } else {
                    // #TODO: can this be the case? Neither locally scoped nor global.
                  }
                } else {
                  //logIdentifier('get global var', path);
                  rewriteReadGlobal(path);
                }
                return;
              }

              //logIdentifier('others', path);
              return;

              if (path.node[GENERATED_IMPORT_IDENTIFIER]) {
                logIdentifier('Generated Import Identifier', path);
                return;
              }

              // global?
              //if (!path.isReferencedIdentifier()) {
              //logIdentifier('is no referenced identifier', path);
              //return;
              //}

              // The identifier should not reference a variable in current scope
              if (path.scope.hasBinding(path.node.name)) {
                logIdentifier('Binding for ', path);
                return;
              }

              logIdentifier('Unexpected Case', path);

              return;

              //if(RESERVED_IDENTIFIERS.includes(path.node.name)) { return; }

              if (t.isClassDeclaration(path.parent)) {
                console.log("classDecl", path.node.name);
                return;
              }

              if (t.isClassMethod(path.parent)) {
                console.log("classMethod", path.node.name);
                return;
              }

              if (t.isObjectMethod(path.parent)) {
                console.log("objectMethod", path.node.name);
                return;
              }
              if (t.isVariableDeclarator(path.parent)) {
                console.log("varDecl", path.node.name);
                return;
              }

              // is this correct here?
              // TODO: is it correct for the locals plugin?
              if (!path.isReferencedIdentifier()) {
                console.log("def", path.node.name);
                return;
              }

              // is locally defined variable?
              if (path.scope.hasBinding(path.node.name)) {
                console.log("local", path.node.name);
              } else {
                // we have a global
                console.log("global", path.node.name);
              }
            },
            /*MD # AssigmentExpression MD*/
            AssignmentExpression(path) {
              if (isInForLoopIterator(path)) {
                return;
              }
              if (isInDestructuringAssignment(path)) {
                return;
              }
              // check, whether we assign to a member (no support for pattern right now)
              if (t.isMemberExpression(path.node.left) && !isGenerated(path) && SET_MEMBER_BY_OPERATORS[path.node.operator]) {
                let parameters = [path.node.left.object, getPropertyFromMemberExpression(path.node.left), path.node.right];
                if(Preferences.get("EnableAEDebugging")) {
                  parameters.push(getSourceLocation(path.node, state, template, t));
                }
                
                //state.file.addImport
                path.replaceWith(t.callExpression(addCustomTemplate(state.file, SET_MEMBER_BY_OPERATORS[path.node.operator], path), parameters));
              }

              if (t.isIdentifier(path.node.left) && !path.node[FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION]) {
                if (path.scope.hasBinding(path.node.left.name)) {
                  //console.log('set local', path.node.left.name);
                  path.node[FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION] = true;

                  const parentWithScope = path.findParent(par => par.scope.hasOwnBinding(path.node.left.name));
                  if (parentWithScope) {
                    let valueToReturn = t.identifier(path.node.left.name);
                    valueToReturn[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
                    let valueForAExpr = t.identifier(path.node.left.name);
                    valueForAExpr[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
                    // #TODO: turn into .insertAfter
                    // caution: doing so automatically inserts a temporary variable (_temp), which is in turn rewritten!
                    //path.insertAfter(
                    //t.ifStatement(
                    //  t.booleanLiteral(true),
                    //  t.expressionStatement(
                    //    t.callExpression(
                    //      addCustomTemplate(state.file, SET_LOCAL),
                    //      [
                    //        getIdentifierForExplicitScopeObject(parentWithScope),
                    //        t.stringLiteral(path.node.left.name)
                    //      ]
                    //    )
                    //  )
                    //)
                    //);
                    const parameters = [getIdentifierForExplicitScopeObject(parentWithScope), t.stringLiteral(path.node.left.name), valueForAExpr];
                    if(Preferences.get("EnableAEDebugging")) {
                      parameters.push(getSourceLocation(path.node, state, template, t));
                    }
                    path.replaceWith(t.sequenceExpression([path.node, t.conditionalExpression(t.booleanLiteral(true), t.callExpression(addCustomTemplate(state.file, SET_LOCAL, path), parameters), t.unaryExpression('void', t.numericLiteral(0))), valueToReturn]));
                  } else if (path.get('left').scope.hasGlobal(path.node.left.name)) {
                    path.node[FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION] = true;
                    wrapSetGlobal(path);
                  } else {
                    // #TODO: can this be the case? Neither locally scoped nor global.
                  }
                } else {
                  // global assginment
                  //console.log('---global---', path.node.left.name);
                  path.node[FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION] = true;
                  wrapSetGlobal(path);
                }
              }
            },

            /*MD # MemberExpression MD*/
            MemberExpression(path) {
              // lval (left values) are ignored for now
              if (path.parentPath.isCallExpression() && path.parentKey === "callee") {
                return;
              }
              // #TODO: BindExpressions are ignored for now; they are static anyway ;)
              if (path.parentPath.isBindExpression() && path.parentKey === "callee") {
                return;
              }
              if (t.isAssignmentExpression(path.parent) && path.key === 'left') {
                return;
              }
              if (t.isUpdateExpression(path.parent) && path.key === 'argument') {
                return;
              }
              if (t.isSuper(path.node.object)) {
                return;
              }
              if (isGenerated(path)) {
                return;
              }
              if (isInForLoopIterator(path)) {
                return;
              }
              if (isInDestructuringAssignment(path)) {
                return;
              }
              if (path.node[FLAG_SHOULD_NOT_REWRITE_MEMBER_EXPRESSION]) {
                return;
              }

              path.replaceWith(t.callExpression(addCustomTemplate(state.file, GET_MEMBER, path), [path.node.object, getPropertyFromMemberExpression(path.node)]));
            },

            /*MD # CallExpression MD*/
            CallExpression(path) {
              if (isGenerated(path)) {
                return;
              }
              if (path.node.callee && t.isSuper(path.node.callee.object)) {
                return;
              }
              if (path.node[FLAG_SHOULD_NOT_REWRITE_CALL_EXPRESSION]) {
                return;
              }
              if (isInForLoopIterator(path)) {
                return;
              }
              if (isInDestructuringAssignment(path)) {
                return;
              }

              if (t.isMemberExpression(path.node.callee)) {
                const methodName = path.node.callee.property.name;
                if (methodName === "dataflow" || methodName === "onChange" || methodName === "offChange") {
                  const args = path.get('arguments');
                  if (args.length > 0) {
                    const expressionPath = args[0];
                    const sourceCode = expressionPath.getSource();
                    path.pushContainer('arguments', t.objectExpression([t.objectProperty(t.identifier("sourceCode"), t.stringLiteral(sourceCode))]));
                    if(args.length > 1) {
                      const databindingFlag = args[1];
                      if(t.isBooleanLiteral(databindingFlag.node, {value: true})) {
                        lively.notify("Databinding detected");
                        debugger;                        
                      }
                    }
                  }
                  //addOriginalSourceCode(path);
                  return;
                }
              }

              // check whether we call a MemberExpression
              if (t.isMemberExpression(path.node.callee)) {
                function isDuplicatableMemberExpression(memberPath) {
                  const objectPath = memberPath.get('object');
                  const isSimpleObject = objectPath.isIdentifier() || objectPath.isThisExpression();
                  const isComputedProperty = memberPath.node.computed;
                  const propertyPath = memberPath.get('property');
                  let isSimpleProperty;
                  if (isComputedProperty) {
                    isSimpleProperty = propertyPath.isStringLiteral() || propertyPath.isIdentifier();
                  } else {
                    isSimpleProperty = propertyPath.isIdentifier();
                  }
                  return isSimpleObject && isSimpleProperty;
                }

                if (isDuplicatableMemberExpression(path.get("callee"))) {
                  function getTraceIdentifierForSimpleObject(objectPath) {
                    if (objectPath.isIdentifier()) {
                      return nonRewritableIdentifier(objectPath.node.name);
                    } else if (objectPath.isThisExpression()) {
                      return t.thisExpression();
                    } else {
                      throw objectPath.buildCodeFrameError("Tried to trace a simple MemberExpression>object, but it is neither an Identifier nor a ThisExpression");
                    }
                  }

                  const traceIdentifier = getTraceIdentifierForSimpleObject(path.get('callee').get('object'));
                  // break a recursive call expression when doing `(obj.fn(), obj.fn());`
                  path.node[FLAG_SHOULD_NOT_REWRITE_CALL_EXPRESSION] = true;
                  // insert traceMember before actual call
                  path.insertBefore(checkExpressionAnalysisMode(t.callExpression(addCustomTemplate(state.file, TRACE_MEMBER, path), [traceIdentifier, getPropertyFromMemberExpression(path.node.callee)])));
                } else {
                  path.replaceWith(t.callExpression(addCustomTemplate(state.file, GET_AND_CALL_MEMBER, path), [path.node.callee.object, getPropertyFromMemberExpression(path.node.callee), t.arrayExpression(path.node.arguments)]));
                }
              } else {
                // call to a local/global variable is handled elsewhere
                if (t.isIdentifier(path.node.callee) && true) {}
              }
            }

          });
        }
      }
    }
  };
}