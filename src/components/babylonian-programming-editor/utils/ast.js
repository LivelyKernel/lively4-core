import { babel } from 'systemjs-babel-build';
const { traverse } = babel;

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