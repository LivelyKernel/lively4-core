import d3visualize from 'src/external/aexpr/babel-plugin-aexpr-source-transformation/visualize-ast.js';
import { addCustomTemplate, GENERATED_IMPORT_IDENTIFIER } from 'src/external/aexpr/babel-plugin-aexpr-source-transformation/utils.js';

const AEXPR_IDENTIFIER_NAME = "aexpr";

const GET_MEMBER = "getMember";
const GET_AND_CALL_MEMBER = "getAndCallMember";

const IGNORE_STRING = "aexpr ignore";
const IGNORE_INDICATOR = Symbol("aexpr ignore");

const SET_MEMBER_BY_OPERATORS = {
  '=': 'setMember',
  '+=': 'setMemberAddition',
  '-=': 'setMemberSubtraction',
  '*=': 'setMemberMultiplication',
  '/=': 'setMemberDivision',
  '%=': 'setMemberRemainder',
  //'**=': 'setMemberExponentiation',
  '<<=': 'setMemberLeftShift',
  '>>=': 'setMemberRightShift',
  '>>>=': 'setMemberUnsignedRightShift',
  '&=': 'setMemberBitwiseAND',
  '^=': 'setMemberBitwiseXOR',
  '|=': 'setMemberBitwiseOR'
};

const SET_LOCAL = "setLocal";
const GET_LOCAL = "getLocal";

const SET_GLOBAL = "setGlobal";
const GET_GLOBAL = "getGlobal";

// TODO: use multiple flag for indication of generated content, marking explicit scopes, etc.
const FLAG_GENERATED_SCOPE_OBJECT = Symbol('FLAG: generated scope object');
const FLAG_SHOULD_NOT_REWRITE_IDENTIFIER = Symbol('FLAG: should not rewrite identifier');
const FLAG_SHOULD_NOT_REWRITE_MEMBER_EXPRESSION = Symbol('FLAG: should not rewrite member expression');
const FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION = Symbol('FLAG: should not rewrite assignment expression');

export default function(param) {
  let { types: t, template, traverse } = param;
  //console.log(arguments);

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
    return path.findParent(p => t.isFunctionDeclaration(p.node) && p.node[GENERATED_FUNCTION])
  }

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

  return {
    pre(file) {
      //console.log("fff", file, traverse);

      function ignoreFile() {
        console.log("IGNORED!!!");
        file[IGNORE_INDICATOR] = true;
      }

      traverse(file.ast, {
        enter(path) {
          if (
            path.node.leadingComments &&
            path.node.leadingComments.some(comment => comment.value.includes(IGNORE_STRING))
          ) {
            ignoreFile();
          }
        },
        DirectiveLiteral(path) {
          if(path.node.value === IGNORE_STRING) { ignoreFile(); }
        }
      });
    },
    visitor: {
      Program: {
        enter(path, state) {
          if(state.file[IGNORE_INDICATOR]) { console.log("read ignored"); return; }
          console.log("file", path, state);

          function getIdentifierForExplicitScopeObject(parentWithScope) {
            let bindings = parentWithScope.scope.bindings;
            let scopeName = Object.keys(bindings).find(key => {
              return bindings[key].path &&
                bindings[key].path.node &&
                bindings[key].path.node.id &&
                bindings[key].path.node.id[FLAG_GENERATED_SCOPE_OBJECT] // should actually be IS_EXPLICIT_SCOPE_OBJECT
            });

            let uniqueIdentifier;
            if(scopeName) {
              uniqueIdentifier = t.identifier(scopeName);
            } else {
              uniqueIdentifier = parentWithScope.scope.generateUidIdentifier('scope');
              uniqueIdentifier[FLAG_GENERATED_SCOPE_OBJECT] = true;

              parentWithScope.scope.push({
                kind: 'let',
                id: uniqueIdentifier,
                init: t.objectExpression([])
              });
            }
            uniqueIdentifier[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
            return uniqueIdentifier;
          }

          d3visualize({ path, state, t, template, traverse });
          
          const identifiers = [];
          path.traverse({
            Identifier(path) { identifiers.push(path); }
          });
          
          path.traverse({
            Identifier(path) {
              //console.log(path.node.name)

              function logIdentifier(msg, path) {
                  console.log(msg, path.node.name, path.node.loc ? path.node.loc.start.line : '');
              }

              if(path.node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER]) { return; }

              // Check for a call to undeclared aexpr:
              if(
                  t.isCallExpression(path.parent) &&
                  path.node.name === AEXPR_IDENTIFIER_NAME &&
                  !path.scope.hasBinding(AEXPR_IDENTIFIER_NAME)
              ) {
                  //logIdentifier("call to aexpr", path);
                  path.replaceWith(
                      addCustomTemplate(state.file, AEXPR_IDENTIFIER_NAME)
                  );
                  return;
              }

              // property local of ExportStatement
              if(
                  t.isExportSpecifier(path.parent) &&
                  path.parentKey === 'local'
              ) {
                  return;
              }

              function isVariable(path) {
                if(t.isImportNamespaceSpecifier(path.parent) && path.parentKey === 'local') { return false; } // import * as foo from 'utils';
                if(t.isLabeledStatement(path.parent) && path.parentKey === 'label') { return false; } // always: { ... }
                if(t.isBreakStatement(path.parent) && path.parentKey === 'label') { return false; } // break: foo;
                return true;
              }
              if(
                // TODO: is there a general way to exclude non-variables?
                isVariable(path) &&
                !(t.isForInStatement(path.parent) && path.parentKey === 'left') &&
                !(t.isAssignmentPattern(path.parent) && path.parentKey === 'left') &&
                !(t.isUpdateExpression(path.parent)) &&
                !(t.isFunctionExpression(path.parent) && path.parentKey === 'id') &&
                !(t.isImportDefaultSpecifier(path.parent) && path.parentKey === 'local') &&
                !(t.isCatchClause(path.parent) && path.parentKey === 'param') &&
                !t.isObjectProperty(path.parent) &&
                !t.isClassDeclaration(path.parent) &&
                !t.isClassExpression(path.parent) &&
                !t.isClassMethod(path.parent) &&
                !t.isImportSpecifier(path.parent) &&
                !t.isMemberExpression(path.parent) &&
                !t.isObjectMethod(path.parent) &&
                !t.isVariableDeclarator(path.parent) &&
                !t.isFunctionDeclaration(path.parent) &&
                !(t.isArrowFunctionExpression(path.parent) && path.parentKey === 'params') &&
                !(t.isExportSpecifier(path.parent) && path.parentKey === 'exported') &&
                !(t.isFunctionExpression(path.parent) && path.parentKey === 'params') &&
                !t.isRestElement(path.parent) && (!t.isAssignmentExpression(path.parent) || !(path.parentKey === 'left'))
              ) {
                if(path.scope.hasBinding(path.node.name)) {
                  //logIdentifier('get local var', path)
                  path.node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;

                  let parentWithScope = path.findParent(par =>
                    par.scope.hasOwnBinding(path.node.name)
                  );
                  if(parentWithScope) {

                    path.replaceWith(
                      t.sequenceExpression([
                        t.callExpression(
                          addCustomTemplate(state.file, GET_LOCAL),
                          [
                            getIdentifierForExplicitScopeObject(parentWithScope),
                            t.stringLiteral(path.node.name)
                          ]
                        ),
                        path.node
                      ])
                    );
                  }
                } else {
                  //logIdentifier('get global var', path);
                  path.node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;

                  path.replaceWith(
                    t.sequenceExpression([
                      t.callExpression(
                        addCustomTemplate(state.file, GET_GLOBAL),
                        [t.stringLiteral(path.node.name)]
                      ),
                      path.node
                    ])
                  );
                }
                return;
              }

              //logIdentifier('others', path);
              return;

              if(path.node[GENERATED_IMPORT_IDENTIFIER]) {
                logIdentifier('Generated Import Identifier', path)
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

              if(t.isClassDeclaration(path.parent)) {
                console.log("classDecl", path.node.name);
                return;
              }

              if(t.isClassMethod(path.parent)) {
                console.log("classMethod", path.node.name);
                return;
              }

              if(t.isObjectMethod(path.parent)) {
                console.log("objectMethod", path.node.name);
                return;
              }
              if(t.isVariableDeclarator(path.parent)) {
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
            AssignmentExpression(path) {
              // check, whether we assign to a member (no support for pattern right now)
              if(t.isMemberExpression(path.node.left) &&
                !isGenerated(path) &&
                SET_MEMBER_BY_OPERATORS[path.node.operator]
              ) {
                //state.file.addImport
                path.replaceWith(
                  t.callExpression(
                    addCustomTemplate(state.file, SET_MEMBER_BY_OPERATORS[path.node.operator]),
                    [
                      path.node.left.object,
                      getPropertyFromMemberExpression(path.node.left),
                      //t.stringLiteral(path.node.operator),
                      path.node.right
                    ]
                  )
                );
              }

              if(t.isIdentifier(path.node.left) &&
                !path.node[FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION]) {
                if(path.scope.hasBinding(path.node.left.name)) {
                  //console.log('set local', path.node.left.name);
                  path.node[FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION] = true;

                  let parentWithScope = path.findParent(par =>
                      par.scope.hasOwnBinding(path.node.left.name)
                  );
                  if(parentWithScope) {

                    let valueToReturn = t.identifier(path.node.left.name);
                    valueToReturn[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
                    path.replaceWith(
                      t.sequenceExpression([
                        path.node,
                        t.callExpression(
                          addCustomTemplate(state.file, SET_LOCAL),
                          [
                            getIdentifierForExplicitScopeObject(parentWithScope),
                            t.stringLiteral(path.node.left.name)
                          ]
                        ),
                        valueToReturn
                      ])
                    );
                  }
                } else {
                  // global assginment
                  //console.log('---global---', path.node.left.name);
                  path.node[FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION] = true;

                  let valueToReturn = t.identifier(path.node.left.name);
                  valueToReturn[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
                  path.replaceWith(
                    t.sequenceExpression([
                      path.node,
                      t.callExpression(
                        addCustomTemplate(state.file, SET_GLOBAL),
                        [t.stringLiteral(path.node.left.name)]
                      ),
                      valueToReturn
                    ])
                  );

                }
              }

            },

            MemberExpression(path) {
              // lval (left values) are ignored for now
              if(t.isAssignmentExpression(path.parent) && path.key === 'left') { return; }
              if(t.isUpdateExpression(path.parent) && path.key === 'argument') { return; }
              if(t.isSuper(path.node.object)) { return; }
              if(isGenerated(path)) { return; }
              //FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION
              path.replaceWith(
                t.callExpression(
                  addCustomTemplate(state.file, GET_MEMBER),
                  [
                    path.node.object,
                    getPropertyFromMemberExpression(path.node)
                  ]
                )
              );
            },

            CallExpression(path) {
              if(isGenerated(path)) { return; }
              if(path.node.callee && t.isSuper(path.node.callee.object)) { return; }

              // check whether we call a MemberExpression
              if(t.isMemberExpression(path.node.callee)) {
                path.replaceWith(
                  t.callExpression(
                    addCustomTemplate(state.file, GET_AND_CALL_MEMBER),
                    [
                      path.node.callee.object,
                      getPropertyFromMemberExpression(path.node.callee),
                      t.arrayExpression(path.node.arguments)
                    ]
                  )
                )
              } else {
                if(t.isIdentifier(path.node.callee) && true) {
                }
              }
            }
          });
        }
      }
    }
  };
}