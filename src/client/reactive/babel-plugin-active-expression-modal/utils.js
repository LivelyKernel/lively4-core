
import {GENERATED_IMPORT_IDENTIFIER } from './constants.js';
export function addCustomTemplate(file, name) {
  let declar = file.declarations[name];
  if (declar) return declar;

  let identifier = file.declarations[name] = file.addImport("active-expression-rewriting", name, name);
  identifier[GENERATED_IMPORT_IDENTIFIER] = true;
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

export function isVariable(path) {
  if(path.parentPath.isImportNamespaceSpecifier() && path.parentKey === 'local') { return false; } // import * as foo from 'utils';
  if(path.parentPath.isLabeledStatement() && path.parentKey === 'label') { return false; } // always: { ... }
  if(path.parentPath.isBreakStatement() && path.parentKey === 'label') { return false; } // break: foo;
  if(path.parentPath.isMemberExpression() && path.parentKey === 'property') { return false; } // super.foo

  return true;
}

export function getParentWithScope(path) {
  return path.findParent(par => par.scope.hasOwnBinding(path.node.name));
}
