//import {livelyModules} from '../lively.modules/dist/lively.modules.js';
//import {livelyAST} from '../lively.ast/dist/lively.ast.js';

System.import("https://lively-kernel.org/lively4/lively.modules/dist/lively.modules.js")
.then(m => { lively.modules = m; })
.then(function() {
  System.import("https://lively-kernel.org/lively4/lively.ast/dist/lively.ast.js")
    .then(m => { lively.ast = m; })
    .then(function() {
      //var expr = lively.ast.parse("var ret = 0; if(obj.b.c.d.e == this.a.b.d.e) null(); ret = this.a; ret = ret + obj.b;");
      var expr = lively.ast.parse("obj.height > 100");
      
      var state = {
        localVariables: [], 
        variablesToObserve: [],
        ownVariablesToObserve: [],
        lastMemberExpression: null
      };
      
      lively.ast.acorn.walk.simple(expr, {
        'VariableDeclarator': function(node, state) {
          var varName = node.id.name;
          state.localVariables.push(varName);
        }, 
        'MemberExpression': function(node, state, c) {
          if(node.object.type == 'MemberExpression') {
            node.object.name = state.lastMemberExpression;
          }
          
          if(node.object.type == 'ThisExpression') {
            let varName = node.property.name;
            
            state.ownVariablesToObserve.push(varName);
            return;
          }
          
          console.log(node);
          
          let varName = node.object.name + '.' + node.property.name;
          state.lastMemberExpression = varName;
          state.variablesToObserve.push(varName);
        }, 
        'Identifier': function(node, state, c) {
          if(state.localVariables.indexOf(node.name) !== -1) {
            return;
          }
          console.log(node);
          
          state.variablesToObserve.push(node.name);
        }
      }, undefined, state);
      
      console.log(state);
    });
    
    
/*
function expr(expr, cb, context) {
  var neededVars = ... mein kram;
  forEach(...)
  proxify(context, needeVars, cb);
}
*/
    
/*
TODO:
expr("obj.height > 100", cb, obj)

cb is called every time that expr is true on obj

*/

});