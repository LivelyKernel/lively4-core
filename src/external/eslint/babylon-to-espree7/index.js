/*  depends on babel-eslint plugin, version 10.1.0
    https://github.com/babel/babel-eslint 
*/

import { attachComments } from "./attachComments.js";
import { convertComments } from "./convertComments.js";
import { toTokens } from "./toTokens.js";
import { toAST } from "./toAST.js";

export function babylonToEspree(ast, traverse, tt, t, code) {
  // debugger
  // convert tokens
  ast.tokens = toTokens(ast.tokens, tt, code);

  // add comments
  convertComments(ast.comments);

  // transform esprima and acorn divergent nodes
  toAST(ast, traverse, t, code);

  // remove File
  ast.type = "Program";
  ast.sourceType = ast.program.sourceType;
  ast.directives = ast.program.directives;
  ast.body = ast.program.body;
  delete ast.program;

  attachComments(ast, ast.comments, ast.tokens);
  
  return ast;
}
