/* global babelParser */

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import babelPluginSyntaxJSX from 'babel-plugin-syntax-jsx';
import babelPluginSyntaxDoExpressions from  'babel-plugin-syntax-do-expressions';
import babelPluginSyntaxFunctionBind from 'babel-plugin-syntax-function-bind';
import babelPluginSyntaxGenerators from 'babel-plugin-syntax-async-generators';

import "src/external/eslint/babelParser_bundle2.js";

const syntaxPlugins = [
  babelPluginSyntaxJSX,
  babelPluginSyntaxDoExpressions,
  babelPluginSyntaxFunctionBind,
  babelPluginSyntaxGenerators
];


const code = "const b = {a: 3, get k(){return 5}};"
const ast = babelParse(code, {});
console.log(JSON.stringify(ast));

function babelParse(code) {
  return babel.transform(code, {
          babelrc: false,
          plugins: syntaxPlugins,
          presets: [],
          filename: undefined,
          sourceFileName: undefined,
          moduleIds: false,
          sourceMaps: false,
          compact: false,
          comments: true,
          code: true,
          ast: true,
          resolveModuleSource: undefined
        }).ast;
}

export function parse(
    code,
    options
) {
    return parseForESLint(code, options).ast;
}

export function parseForESLint (
    code,
    options,
) {
  var ast = babelParser(code, {
    plugins: [...syntaxPlugins],
    sourceType: options.sourceType,
    jsx: (options.ecmaFeatures ? options.ecmaFeatures.jsx : false),
    babelrc: false,
    allowImportExportEverywhere: true,
    presets: [],
});

    const scopeManager = null;
    const visitorKeys = null;
    return { ast, scopeManager, visitorKeys };
      
}
