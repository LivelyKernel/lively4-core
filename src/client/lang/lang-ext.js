import 'lang';
import { extend } from './utils.js';

/*MD
## OBJECT
MD*/
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import jsx from 'babel-plugin-syntax-jsx';
import doExpressions from 'babel-plugin-syntax-do-expressions';
import functionBind from 'babel-plugin-syntax-function-bind';
import asyncGenerators from 'babel-plugin-syntax-async-generators';
const SYNTAX_PLUGINS = [jsx, doExpressions, functionBind, asyncGenerators];

const filename = "tempfile.js";
const BABEL_CONFIG_DEFAULT = {
  babelrc: false,
  plugins: SYNTAX_PLUGINS,
  presets: [],
  filename: filename,
  sourceFileName: filename,
  moduleIds: false,
  sourceMaps: true,
  // inputSourceMap: load.metadata.sourceMap,
  compact: false,
  comments: true,
  code: true,
  ast: true,
  resolveModuleSource: undefined
};

extend(Object.prototype, {

  dependentAExprs() {
    return AExprRegistry.allAsArray().filter(ae => {
      if (!ae.supportsDependencies()) {
        return false;
      }

      const dependencies = ae.dependencies().all();
      return dependencies.find(dep => {
        const desc = dep.getAsDependencyDescription();
        return desc.object === this || desc.value === this || desc.scope === this;
      });
    });
  },

  transformAsAST(fullPluginOrVisitor, configExtension = {}) {
    const iteratorPlugin = fullPluginOrVisitor instanceof Function ?
      fullPluginOrVisitor :
      // only got the visitor: need to bridge to a plugin function as expected by babel
      () => ({ visitor: fullPluginOrVisitor });

    let babelConfig = Object.assign({}, BABEL_CONFIG_DEFAULT, {
      plugins: [...SYNTAX_PLUGINS, iteratorPlugin]
    });
      
    babelConfig = Object.assign(babelConfig, configExtension);

    return babel.transformFromAst(this, undefined, babelConfig);
  },

  // using `babel.traverse` also allows for wild cards to match AST nodes
  traverseAsAST(visitor) {
    return babel.traverse(this, visitor);
  },
  openInInspector() {
    lively.openInspector(this);
  }

});

/*MD
## STRING
MD*/

import boundEval from "src/client/bound-eval.js";

extend(String.prototype, {

  toAST() {
    return babel.transform(this, BABEL_CONFIG_DEFAULT).ast;
  },

  /**
   * @example providing a visitor object
   * var ids = [];
   * `let x = 0, y = x +2;`.transformAsAST({
   *   Identifier(path) {
   *     ids.push(path.node.name);
   *   }
   * });
   * ids;
   * 
   * @example providing a full-fledged plugin function
   * var ids = [];
   * `let x = 0, y = x +2;`.transformAsAST(({ types: t, template, traverse }) => ({
   *   visitor: {
   *     Identifier(path) {
   *       ids.push(path.node.name);
   *     }
   *   }
   * }));
   * ids;
   */
  transformAsAST(fullPluginOrVisitor) {
    return this.toAST().transformAsAST(fullPluginOrVisitor);
  },

  /*
   * @example printing all node types found in source code
   * `var a = 42, b = 423; lively::foo`.traverseAsAST({
   *    enter(path) {
   *      lively.notify(path.node.type)
   *    }
   *  });
   */
  traverseAsAST(visitor) {
    return this.toAST().traverseAsAST(visitor);
  },

  async boundEval(thisReference, targetModule) {
    const result = await boundEval(this, thisReference, targetModule);
    if (result.isError) {
      throw result.value;
    } else {
      return result.value;
    }
  }

});

/*MD
## FUNCTION
MD*/
import aexpr from 'active-expression-rewriting';

const aexprByFunction = new WeakMap();

extend(Function.prototype, {

  asAExpr() {
    return aexprByFunction.getOrCreate(this, () => aexpr(this));
  },

  onChange(callback) {
    return this.asAExpr().onChange(callback);
  },

  onBecomeTrue(callback) {
    return this.asAExpr().onBecomeTrue(callback);
  },

  onBecomeFalse(callback) {
    return this.asAExpr().onBecomeFalse(callback);
  }

});