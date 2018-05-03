import { babel } from 'systemjs-babel-build';
const { traverse, transform } = babel;

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
  return path.isIdentifier();
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
 * Generates a replacement node (without expression) for a given code
 */
export const replacementNodeForCode = (code) => {
  const ast = astForCode(code);
  return ast.program.body[0].expression;
}

const astForCode = (code) =>
  transform(code, {
    babelrc: false,
    plugins: [],
    presets: [],
    filename: undefined,
    sourceFileName: undefined,
    moduleIds: false,
    sourceMaps: false,
    compact: false,
    comments: true,
    code: false,
    ast: true,
    resolveModuleSource: undefined
  }).ast
