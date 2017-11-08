import generateUUID from 'src/client/uuid.js'; 

export default function (babel) {
  const { types: t, template, transformFromAst } = babel;
  let log = template("_tr_(NAME,CODE,() => EXPSTATE, START, END, this, locals)")
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
        	BinaryExpression(path) {
        		path.node.traceid = idcounter++;
        		expressions.push(path) 
        	},
        	CallExpression(path) { 
        		path.node.traceid = idcounter++;
        		expressions.push(path) 
        	}, 
        	VariableDeclaration(path) { 
        		path.node.traceid = idcounter++;
        		declarations.push(path) 
        	},
        	ExpressionStatement(path) {
        		path.node.traceid = idcounter++;
        		statements.push(path)
        	},
        	/* ... */
        });
        
        var ast = JSON.parse(JSON.stringify(path.node))
		    ast.astid = generateUUID()
		    if (!window.__tr_ast_registry__) window.__tr_ast_registry__ = {};
		    window.__tr_ast_registry__[ast.astid]=ast
			

	  	  path.unshiftContainer('body', template(`
	  		var __tr_ast__=window.__tr_ast_registry__[ASTID]
	  		
	  		function _tr_(name, code, exp, start, end, object, context) {
	  			console.log("  ".repeat(__tr_depth__) + code)
	  			
	  			var node = {start: start, end: end, children: []}
				var parent = __tr_current__
				parent.children.push(node)
	  			
	  			__tr_current__=node
	  			
	  			
	  			__tr_depth__++
	  			var value = exp()
	  			__tr_depth__--
	  			node.code = code
	  			node.name = name
	  			node.value = value;
	  			node.context = context;
	  			node.object = object
	  			
	  			__tr_current__ = parent
	  			
	  			console.log("  ".repeat(__tr_depth__) + "-> " + value)
	  			return value
	  	};
	  	
	  	function _tr_begin_(id) {
	  		__tr_depth__++
	  	};
	  	function _tr_end_(id) {
	  		__tr_depth__--
	  	};
	  	var __tr_depth__=0; 
	  	var __tr_root__  = { children: [] };
	  	window.__tr__root__ = __tr_root__
	  	var __tr_current__=__tr_root__`)({ASTID: t.stringLiteral(ast.astid)}))
	  	

 	  	statements.forEach(ea => {
     		ea.insertBefore(begin({
       		NODEID: t.numberLiteral(ea.node.traceid)
       	}))
       	ea.insertAfter(end({
       		NODEID: t.numberLiteral(ea.node.traceid)
       	}))
      })
     
      expressions.forEach(ea => {
     		// babel modifies ast during transform, so we copy it through serialization
     		
     		var ast = transformFromAst({
		    "type": "Program",
		    "body": [JSON.parse(JSON.stringify(ea.node))]
		    })
		
      	ea.replaceWith(log({
      		EXPSTATE: ea,
      		NAME: t.stringLiteral("" + ea.node.operator),
      		CODE: t.stringLiteral("" + ast.code),
      		START: t.numberLiteral(ea.node.start !== undefined ? ea.node.start : -1),
      		END: t.numberLiteral(ea.node.end  !== undefined ? ea.node.end : -1)
      	}))
      })
      } 
    }
  };
}