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

//var code = "var ret = 0; if(obj.b.c.d.e == this.a.b.d.e) null(); ret = this.a; ret = ret + obj.b;";
//var code = "var width = 1 + obj.dimensions.width + obj.margin.top.left; var isTooBig = lively.width() / 100 || asdf; width > 100";
//var code = "var width = obj.width(); width < 100";
var code = "obj.width > 100";
var callback = function() {console.log('changed')};
var object = {
  height: 100,
  width: 200
};
var context = {obj: object};

expr(code, callback, context);

function expr(expression, callback, context) {
  let ast = lively.ast.parse(expression);
  let observables = detectObservables(ast);
  proxify(context, observables.variablesToObserve, callback);
}

function proxify(context, observables, callback) {
  for(let observable of observables) {
    let observableParts = observable.split('.');
    let contextVariableName = observableParts.shift();
    let objectPropertyName = observableParts.join("");

    let object = null;
    if(contextVariableName != observable) {
      object = context[contextVariableName];

      if(object) {
        proxifyVariable(object, objectPropertyName, callback);
      }
    } else {
      //has no dot in its name, so is probably a global var?
    }
    
  }
}

function proxifyVariable(object, variable, callback) {
  console.log(object, variable, callback);
  console.log("TODO: implement active-expressions::proxifyVariable");
}

function detectObservables(ast) {
  var state = {
    localVariables: [],
    variablesToObserve: [],
    ownVariablesToObserve: []
  };

  lively.ast.acorn.walk.recursive(ast, state, {
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
      state.variablesToObserve.push(varName);
    },
    'ThisExpression': function ThisExpression(node, state, c) {
      //makes no sense all alone, so only used to get 'varName'

      state.varName = 'this';
    },
    'Identifier': function Identifier(node, state, c) {
      if (state.localVariables.indexOf(node.name) === -1) {
        state.variablesToObserve.push(node.name);
      }

      state.varName = node.name;
    }
  });

  return state;
}