
//import {livelyModules} from '../lively.modules/dist/lively.modules.js';
//import {livelyAST} from '../lively.ast/dist/lively.ast.js';

System["import"]("https://lively-kernel.org/lively4/lively.modules/dist/lively.modules.js").then(function (m) {
  lively.modules = m;
})
.then(function () {
  System["import"]("https://lively-kernel.org/lively4/lively.ast/dist/lively.ast.js").then(function (m) {
    lively.ast = m;
  });
});


class Expr {
  constructor(expression, callback, context) {
    this.originalExpr = expression;
    this.callback = callback;
    this.context = context;

    this.lastValue = undefined;

    this._ast = lively.ast.parseFunction(expression);
    this._declarations = lively.ast.query.topLevelDeclsAndRefs(this._ast);
    this.observables = this.detectObservables();

    this.transformExpression();
    this.proxify();
    
    this.test();
  }
  
  test() {
    let result = this.expr(this.context);
    
    console.log('test returned', result);

    if (this.lastValue === undefined) {
      this.lastValue = result;
    } else {
      if (this.lastValue !== result) {
        console.log('value changed!');
        this.callback();
      }
      this.lastValue = result;
    }
  }
  
  transformExpression() {
    let off = 0;
    
    let src = this.originalExpr.toString();
    
    for (let i = this._declarations.refs.length - 1; i >= 0; i--) {
      let node = this._declarations.refs[i];
      let left = src.substring(0, node.start - 1);
      let right = src.substring(node.start - 1);
      src = left + '__context.' + right;
      off += 10;
    }

    let body = src.substring(this._ast.body.start - 1, this._ast.body.end + off);
    console.log(body);
    this.expr = eval('(function(__context)' + body + ')');
    console.log(this.expr);
  }
  
  detectObservables() {
    var state = {
      localVariables: [],
      variablesToObserve: new Set(),
      ownVariablesToObserve: []
    };

    lively.ast.acorn.walk.recursive(this._ast, state, {
      'VariableDeclarator': function VariableDeclarator(node, state, c) {
        var varName = node.id.name;
        state.localVariables.push(varName);
  
        c(node.init, state);
      },
      'MemberExpression': function MemberExpression(node, state, c) {
        var tmpState = jQuery.extend(true, {}, state);
  
        c(node.object, tmpState);
        node.object.name = tmpState.varName;
  
        c(node.property, tmpState);
        node.property.name = tmpState.varName;
  
        var varName = node.object.name + '.' + node.property.name;
        state.varName = varName;
        state.variablesToObserve.add(varName);
      },
      'ThisExpression': function ThisExpression(node, state, c) {
        //makes no sense all alone, so only used to get 'varName'
  
        state.varName = 'this';
      },
      'Identifier': function Identifier(node, state, c) {
        if (state.localVariables.indexOf(node.name) === -1) {
          state.variablesToObserve.add(node.name);
        }
  
        state.varName = node.name;
      }
    });
  
    return state;
  }
  
  proxify() {
    for(let observable of this.observables.variablesToObserve) {
      let observableParts = observable.split('.');
      let contextVariableName = observableParts.shift();
      let objectPropertyName = observableParts.join("");
  
      let object = null;
      if(contextVariableName != observable) {
        object = context[contextVariableName];
  
        if(object) {
          this.proxifyVariable(object, objectPropertyName, callback);
        }
      } else {
        //has no dot in its name, so is probably a global var?
      }
      
    }
  }
  
  proxifyVariable(object, variable, callback) {
    console.log(object, variable, callback);
    
    ['__lively_expr_getters',
     '__lively_expr_setters',
     '__lively_expr_vars'
    ].forEach((k) => {
      if (object[k] === undefined) {
        object[k] = {};
      }
    })
    
    if (object.__lively_expr_watchers === undefined) {
      object.__lively_expr_watchers = new Set();
    }

    // TODO: handle multiple expressions on same object
    
    let oldGetter = object.__lookupGetter__(variable) || object.__lively_expr_getters[variable];

    let oldSetter = object.__lookupSetter__(variable) || object.__lively_expr_setters[variable];

    if (oldGetter) object.__lively_expr_getters[variable] = oldGetter;
    if (oldSetter) object.__lively_expr_setters[variable] = oldSetter;

    // save current value for default getter
    object.__lively_expr_vars[variable] = object[variable];
    
    object.__lively_expr_watchers.add(this);
    
    console.log('old getter:', oldGetter);
    console.log('old setter:', oldSetter);

    var newGetter = function() {
      if (this.__lively_expr_getters[variable]) {
        return this.__lively_expr_getters[variable].call(this);
      }
      return this.__lively_expr_vars[variable];
    };
    
    var newSetter = function(newValue) {
      if (this.__lively_expr_setters[variable]) {
        this.__lively_expr_setters[variable].call(this, newValue);
      } else {
        this.__lively_expr_vars[variable] = newValue;
      }

      // alert watchers
      this.__lively_expr_watchers.forEach((w) => {
        w.test();
      });
    };
    
    object.__defineGetter__(variable, newGetter);
    object.__defineSetter__(variable, newSetter);
  }
}

//var code = "var ret = 0; if(obj.b.c.d.e == this.a.b.d.e) null(); ret = this.a; ret = ret + obj.b;";
//var code = "var width = 1 + obj.dimensions.width + obj.margin.top.left; var isTooBig = lively.width() / 100 || asdf; width > 100";
//var code = "var width = obj.width(); width < 100";


var object = {
  height: 100,
  width: 200
};
var context = {obj: object};

var expr = new Expr(function() { 
  return obj.width > 100 && obj.width < 1000 
}, () => {
  console.log('changed');
}, context);

setTimeout(function() {
  context.obj.width = 0;  
}, 1000);


