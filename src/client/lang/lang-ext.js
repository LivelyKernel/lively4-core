import 'lang';
import { extend } from './utils.js';

/*MD
## OBJECT
MD*/
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';

import babelDefault from 'src/external/babel/babel7default.js'
const babel = babelDefault.babel;

import {parseForAST, allSyntaxFlags} from "src/plugin-babel.js"


const filename = "tempfile.js";
const BABEL_CONFIG_DEFAULT = {
  babelrc: false,
  plugins: [],
  presets: [],
  filename: filename,
  sourceFileName: filename,
  moduleIds: false,
  sourceMaps: true,
  compact: false,
  comments: true,
  code: true,
  ast: true,
  parserOpts: {
    plugins: allSyntaxFlags,
    errorRecovery: true
  },
  generatorOpts: {
    // auxiliaryCommentAfter: 'hello',
    comments: true,
    compact: false,
    concise: false,
    minified: false,
    // retainFunctionParens: true,
    // retainLines: true,
  },
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
      plugins: [iteratorPlugin]
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
    return parseForAST(this, {syntaxFlags: allSyntaxFlags}).ast
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

/*MD
## STRING
MD*/
extend(String, {
  /**
   * String Interpolation.
   * @public
   * @param from (String) the string from which the interpolation starts
   * @param to (String) the final string
   * @returns {Number} interpolation value from 0 to 1
   * @example <caption>Textlerp Hello World.</caption>
   * String.lerp('worldabcdefgh', 'hello', .898) // -> 'wello'
   * 0 .to(1, 0.1).map(v => String.lerp('abcdef', 'hijklmno', v))
   */
  lerp(from, to, value) {
    // left to right
    if (to.length >= from.length) {
      const current = Math.floor(to.length * value);
      const currentLength = Math.floor(map(from.length - 1, to.length, value));
      let text = '';
      for (let i = 0; i < to.length; i++) {
        if (i < current) {
          text += to[i];
        } else if (from[i] || i <= currentLength) {
          text += from[i] && to[i];
        }
      }

      return text;
    }
    // right to left
    else {
      const current = Math.round(from.length * (1 - value));
      const currentLength = Math.floor(map(from.length + 1, to.length, value));
      const text = [];
      for (let i = from.length - 1; i >= 0; i--) {
        if (i < current) {
          text.unshift(from[i]);
        } else if (to[i] || i < currentLength) {
          text.unshift(to[i] && from[i]);
        }
      }

      return text.join('');
    }
  }
})

// #helper #utils
function map(from, to, value) {
  return from + (to - from) * value;
}
