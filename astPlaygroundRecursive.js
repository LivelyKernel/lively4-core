
class Expr {
  constructor(expression, callback, context) {
    this.originalExpr = expression;
    this.context = context;
    this.callback = callback.bind(context);

    this.lastValue = undefined;
    this.observers = {};

    this._ast = lively.ast.parseFunction(expression);
    this._declarations = lively.ast.query.topLevelDeclsAndRefs(this._ast);
    console.log(this._declarations);
    this.observables = this.detectObservables();

    this.transformExpression();
    this.proxify();
    
    this.test();
  }
  
  test() {
    let result = this.expr(this.context);
    
    console.log(this.expr, this.context);
    console.log('test returned', result);

    if (this.lastValue === undefined) {
      this.lastValue = result;
    } else {
      if (this.lastValue !== result) {
        console.log('value changed!');
        this.callback(result);
      }
      this.lastValue = result;
    }
  }
  
  transformExpression() {
    let off = 0;
    
    let src = this.originalExpr.toString();
    for (let i = this._declarations.refs.length - 1; i >= 0; i--) {
      let node = this._declarations.refs[i];
      
      if (!node.name.includes('.') && window[node.name] !== undefined) {
        // dont replace global objects like parseInt
        continue;
      }
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
    console.log(this.observables.variablesToObserve);
    for(let observable of this.observables.variablesToObserve) {
      let observableParts = observable.split('.');
      let contextVariableName = observableParts.shift();
      let objectPropertyName = observableParts.join(".");
  
      let object = null;
      
      console.log(contextVariableName, observable);
      if(contextVariableName != observable) {
        object = this.context[contextVariableName];
        
        
  
        if(object) {
          this.proxifyVariable(object, objectPropertyName, this.callback);
        }
      } else {
        //has no dot in its name, so is probably a global var?
      }
      
    }
  }
  
  proxifyVariable(object, variable, callback) {
    console.log(object, variable, callback);
    
    if (object instanceof HTMLElement) {
      if (this.observers[object] === undefined) {
        this.observers[object] = {
          attributes: new Set(),
          mutationObserver: null,
          config: {
            attributes: true
          }
        }
        
        var mutationObserver = new MutationObserver(
          (records, m) => this.mutationObserverCallback(records, m)
        );
        mutationObserver.observe(object, this.observers[object].config);
        
        this.observers[object].mutationObserver = mutationObserver;
       
        console.log('set up', this.observers[object]);
      }
      // HTMLElements get special treatment
      return;
    }
    
    if (variable.includes('.')) {
      let components = variable.split('.');
      this.proxifyVariable(object[components[0]], components.splice(1).join('.'), callback);
      return;
    }
    
    console.log('patching ', variable);
    
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
    
    // console.log('old getter:', oldGetter);
    // console.log('old setter:', oldSetter);

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
  
  mutationObserverCallback(records, mutationObserver) {
    // console.log(mutationObserver);
    // console.log(records);
    this.test();
  }
}

//var code = "var ret = 0; if(obj.b.c.d.e == this.a.b.d.e) null(); ret = this.a; ret = ret + obj.b;";
//var code = "var width = 1 + obj.dimensions.width + obj.margin.top.left; var isTooBig = lively.width() / 100 || asdf; width > 100";
//var code = "var width = obj.width(); width < 100";


var object = {
  height: 100,
  width: 200,
  position: {
    x: 1,
    y: 2
  }
};
// var context = {obj: object};

// var expr = new Expr(function() { 
//   return obj.width > 100 && obj.position.x > 0
// }, () => {
//   console.log('changed');
// }, context);

// setTimeout(function() {
//   object.position.x = 0;  
// }, 1000);

var div = document.querySelector('#active-ball');
if (div) div.remove();

div = document.createElement('div');
div.id = "active-ball";
div.style.position = 'absolute';
div.style.width = '30px';
div.style.height = '30px';
div.style.background = 'red';
div.style.left = '50px';
div.style.top = '100px';

document.body.appendChild(div);

var expr = new Expr(
  function() { return parseInt(ball.style.left) > 800 },
  function(newValue) { this.ball.style.background = newValue ? 'red' : 'blue'},
  { ball: div }
);


