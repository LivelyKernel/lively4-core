import d3visualize from './visualize-ast.js';
import {
  isVariable,
  getParentWithScope
} from './utils.js';

import {
  AEXPR_IDENTIFIER_NAME,
  IGNORE_STRING,
  IGNORE_INDICATOR,
  SET_MEMBER_BY_OPERATORS,
  FLAG_GENERATED_SCOPE_OBJECT,
  FLAG_SHOULD_NOT_REWRITE_IDENTIFIER,
  FLAG_SHOULD_NOT_REWRITE_MEMBER_EXPRESSION,
  FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION,
  GENERATED_IMPORT_IDENTIFIER
} from './constants.js';

import * as transformator from './transformators.js';

export default function(param) {
  const { types: t, template, traverse } = param;

  const GENERATED_FUNCTION = Symbol("generated function");
  function isGenerated(path) {
    return path.findParent(p => t.isFunctionDeclaration(p.node) && p.node[GENERATED_FUNCTION])
  }

  return {
    manipulateOptions(opts, parserOpts) {
      //parserOpts.plugins.push("functionBind");
    },
    pre(file) {
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
          //console.log("file", path, state);

          d3visualize({ path, state, t, template, traverse });
          
          const identifiers = [];
          const members = [];
          path.traverse({
            Identifier(path) { identifiers.push(path); },
            MemberExpression(path) { members.push(path); }
          });
          const variables = identifiers
            .filter(p=>p);
          function isCalledMember(memberExpression) {
            if(!memberExpression.parentPath.isCallExpression()) { return false; }
            if(memberExpression.parentKey !== "callee") { return false; }

            if(isGenerated(memberExpression.parentPath)) { return false; }
            if(memberExpression.get("object").isSuper()) { return false; }

            return true;
          }
          const calledMembers = members.filter(isCalledMember);
          calledMembers.reverse().forEach(path => transformator.getAndCallMember(path.parentPath, state, t));

          function isGetMember(path) {
            // lval (left values) are ignored for now
            //lively.notify("STUFF", path.parentKey, path.key)
            if(isCalledMember(path)) { return false; }
            if(path.parentPath.isAssignmentExpression() && path.parentKey === 'left') { return false; }
            if(path.parentPath.isUpdateExpression() && path.parentKey === 'argument') { return false; }
            if(path.get("object").isSuper()) { return false; }
            if(isGenerated(path)) { return false; }
            //lively.notify(path.node.property.name, "");
            return true;
          }
          //lively.notify(members.length, "members")
          const getMembers = members.filter(isGetMember);
          //lively.notify(getMembers.length, "getMembers")
          getMembers.reverse().forEach(path => transformator.getMember(path, state, t));

          path.traverse({
            Identifier(path) {
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
                transformator.callAExpr(path, state, t);
                return;
              }

              // property local of ExportStatement
              if(
                t.isExportSpecifier(path.parent) &&
                path.parentKey === 'local'
              ) {
                return;
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

                  if(getParentWithScope(path)) {
                    //lively.notify(path.node.name, path.parent.type)
                    transformator.getLocal(path, state, t);
                  }
                } else {
                  //logIdentifier('get global var', path);
                  path.node[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;

                  transformator.getGlobal(path, state, t);
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
                transformator.setMember(path, state, t);
                return;
              }

              if(t.isIdentifier(path.node.left) &&
                !path.node[FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION]) {
                if(path.scope.hasBinding(path.node.left.name)) {
                  //console.log('set local', path.node.left.name);
                  path.node[FLAG_SHOULD_NOT_REWRITE_ASSIGNMENT_EXPRESSION] = true;

                  if(getParentWithScope(path.get("left"))) {
                    transformator.setLocal(path, state, t);
                  }
                } else {
                  // global assginment
                  //console.log('---global---', path.node.left.name);
                  transformator.setGlobal(path, state, t);
                }
              }
            }
          });
        }
      }
    }
  };
}
