import { babel } from 'systemjs-babel-build';
const {
  traverse,
  transform,
  transformFromAst
} = babel;

import LocationConverter from "./location-converter.js";
import DefaultDict from "./default-dict.js";

/**
 * Creates a deep copy of arbitrary objects.
 * Does not copy functions!
 */
export const deepCopy = (obj) =>
  JSON.parse(JSON.stringify(obj));

/**
 * Generates a locationMap for the AST
 */
export const generateLocationMap = (ast) => {
  ast._locationMap = new DefaultDict(Object);

  traverse(ast, {
    enter(path) {
      ast._locationMap[LocationConverter.astToKey(path.node.loc)] = path;
    }
  });
};

/**
 * Checks whether a path can be probed
 */
export const canBeProbed = (path) => {
  // TODO: More sophisticated check
  return path.isIdentifier() || path.isReturnStatement();
}

/**
 * Checks whether a path can be an example
 */
export const canBeExample = (path) => {
  // We have to be the name of a function
  const functionParent = path.getFunctionParent();
  return(functionParent
         && (functionParent.get("id") === path
             || functionParent.get("key") === path));
}

/**
 * Checks whether a path can be replaced
 */
export const canBeReplaced = (path) => {
  // We have to be the righthand side of an assignment
  return ((path.parentPath.isVariableDeclarator() && path.parentKey === "init")
          || (path.parentPath.isAssignmentExpression() && path.parentKey === "right"));
}

/**
 * Generates a replacement node
 * (to be used as the righthand side of an assignment)
 */
export const replacementNodeForCode = (code) => {
  // The code we get here will be used as the righthand side of an Assignment
  // We we pretend that it is that while parsing
  code = `placeholder = ${code}`;
  try {
    const ast = astForCode(code);
    return ast.program.body[0].expression.right;
  } catch (e) {
    console.warn("Error parsing replacement node", e);
    return null;
  }
}

/**
 * All the standard parameters for bablylon
 */
const BABYLON_CONFIG = {
  babelrc: false,
  plugins: [],
  presets: [],
  filename: undefined,
  sourceFileName: undefined,
  moduleIds: false,
  sourceMaps: false,
  compact: false,
  comments: false,
  resolveModuleSource: undefined
};

/**
 * Parses code and returns the AST
 */
export const astForCode = (code) =>
  transform(code, Object.assign({}, BABYLON_CONFIG, {
    code: false,
    ast: true
  })).ast

/**
 * Generates executable code for a given AST
 */
export const codeForAst = (ast) =>
  transformFromAst(ast, Object.assign({}, BABYLON_CONFIG, {
    code: true,
    ast: false
  })).code;
