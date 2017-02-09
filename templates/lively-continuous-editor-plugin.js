import generateUUID from 'src/client/uuid.js'; 
import {babel} from 'systemjs-babel-build';

export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;
  let log = template("_tr_(NODEID,() => EXPSTATE)")
  let begin = template("_tr_begin_(NODEID)")
  let end = template("_tr_end_(NODEID)")

  return {
    name: "ast-transform", // not required
    visitor: { 
      Program(path) {
        var idcounter = 0;
        var expressions = []
        var statements = []
        var declarations = []
        
        path.traverse({
        	enter(path) { 
        		path.node.traceid = idcounter++;

			    },
        	BinaryExpression(path) {expressions.push(path) },
        	CallExpression(path) {expressions.push(path)}, 
        	UnaryExpression(path) {expressions.push(path)},
        	UpdateExpression(path) {expressions.push(path)},
        	VariableDeclaration(path) { declarations.push(path) },
        	FunctionDeclaration(path) { declarations.push(path) },
        	ExpressionStatement(path) {statements.push(path) },

        	/* ... */
        });


        var astsrc= JSON.stringify(path.node)
        window.lastastsrc = astsrc
        var programast = JSON.parse(astsrc)
        programast.astid = generateUUID()
    		if (!window.__tr_ast_registry__) window.__tr_ast_registry__ = {};
    		window.__tr_ast_registry__[programast.astid]=programast
    
    		programast.node_map = []
    		// {"type": "File", "program": {programast}}
    		// lively.openInspector(programast)

    		traverse({"type": "File", "program": programast}, {
      			enter(path) {
      			  // console.log("enter " + path.node.type)
      				programast.node_map[path.node.traceid] = path.node
      				path.node.trace_counter = 0;
      			},
    		})	
			
	      path.unshiftContainer('body', template(`
	        var __tr_ast__ = window.__tr_ast_registry__[ASTID]

	  		  function _tr_(id, exp) {
            var astnode =  __tr_ast__ .node_map[id]
  	  		  console.log("enter " + astnode.type )

	  			  var node = {parent: __tr_current__, id: id, children: []}
				    node.parent.children.push(node)
	  			  __tr_current__=node
	  			  
  	  			var value = exp()

            node.id = id
  	  			node.value = value;
  	  			
  	  			__tr_current__ = node.parent
  	  			
  	  			return value
    	  	};
    	  	
    	  	function _tr_begin_(id) {
            var astnode =  __tr_ast__ .node_map[id]
            console.log("begin " + astnode.type )
            
            var callnode = {parent: __tr_current__, id: id, children: []}
				    callnode.parent.children.push(callnode)
	  			  __tr_current__=callnode
    	  	};
    	  	
    	  	// var value = exp()
    	  	
    	  	function _tr_end_(id) {
  	  			__tr_current__ = __tr_current__.parent

    	  	};
    	  	var __tr_root__  = { children: [] };
    	  	__tr_ast__.calltrace = __tr_root__;
    	  	window.__tr_last_ast__ = __tr_ast__;
    	  	var __tr_current__=__tr_root__`)({ASTID: t.stringLiteral(programast.astid)}))
	  	
        statements.forEach(ea => {
       		ea.insertBefore(begin({
         		NODEID: t.numericLiteral(ea.node.traceid)
         	}))
         	ea.insertAfter(end({
         		NODEID: t.numericLiteral(ea.node.traceid)
         	}))
        })

        
        // declarations.forEach(ea => {
       	// 	ea.insertBefore(begin({
        // 		NODEID: t.numericLiteral(ea.node.traceid)
        // 	}))
        // 	ea.insertAfter(end({
        // 		NODEID: t.numericLiteral(ea.node.traceid)
        // 	}))
        // })
     
     
        expressions.forEach(ea => {
       		// babel modifies ast during transform, so we copy it through serialization
       		var ast = transformFromAst({
  			    "type": "Program",
  			    "body": [JSON.parse(JSON.stringify(ea.node))]})
        	
        	ea.replaceWith(log({
        	  NODEID: t.numericLiteral(ea.node.traceid),
        		EXPSTATE: ea
        	}))
        })
      } 
    }
  };
}