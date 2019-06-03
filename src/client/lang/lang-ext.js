import 'lang';
import { extend } from './utils.js';


/*MD
## OBJECT
MD*/
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js'

extend(Object.prototype, {

  dependentAExprs() {
    return AExprRegistry.allAsArray().filter(ae => {
      if(!ae.supportsDependencies()) { return false; }
      
      const dependencies = ae.dependencies().all();
      return dependencies.find(dep => {
        const desc = dep.getAsDependencyDescription();
        return desc.object === this ||
          desc.value === this ||
          desc.scope === this;
      });
    });
  }
});


/*MD
## STRING
MD*/
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import jsx from 'babel-plugin-syntax-jsx';
import doExpressions from 'babel-plugin-syntax-do-expressions';
import functionBind from 'babel-plugin-syntax-function-bind';
import asyncGenerators from 'babel-plugin-syntax-async-generators';
const SYNTAX_PLUGINS = [
  jsx,
  doExpressions,
  functionBind,
  asyncGenerators
];

import boundEval from "src/client/bound-eval.js";

extend(String.prototype, {

  toAST() {
    const filename = "tempfile.js";

    return babel.transform(this, {
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
    }).ast;
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

