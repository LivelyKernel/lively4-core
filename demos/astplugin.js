export default function (babel) {
  const { types: t, template, transformFromAst } = babel;
  let log = template("_tr_(NAME,() => EXPSTATE, START, END)")
  return {
    name: "ast-transform", // not required
    visitor: { 
      Program(path) {
        var statements = []
        path.traverse({
        	BinaryExpression(path) { statements.push(path) },
        	CallExpression(path) { statements.push(path) } 
        	/* ... */
        });

	  	path.unshiftContainer('body', template(`function _tr_(code, exp, start, end) {
	  			console.log("  ".repeat(__tr_depth__) + code)
	  			
	  			var node = {start: start, end: end, children: []}
				var parent = __tr_current__
				parent.children.push(node)
	  			
	  			__tr_current__=node
	  			
	  			
	  			__tr_depth__++
	  			var value = exp()
	  			__tr_depth__--
	  			
	  			node.value = value;
	  			
	  			__tr_current__ = parent
	  			
	  			console.log("  ".repeat(__tr_depth__) + "-> " + value)
	  			return value
	  	};
	  	var __tr_depth__=0; 
	  	var __tr_root__  = { children: [] };
	  	window.__tr__root__ = __tr_root__
	  	var __tr_current__=__tr_root__`)())
	  	

        statements.forEach(ea => {
       		// babel modifies ast during transform, so we copy it through serialization
       		
       		var ast = transformFromAst({
			    "type": "Program",
			    "body": [
			     	JSON.parse(JSON.stringify(ea.node))
			     ]
			})
			
        	ea.replaceWith(log({
        		EXPSTATE: ea,
        		NAME: t.stringLiteral("" + ast.code),
        		START: t.numberLiteral(ea.node.start !== undefined ? ea.node.start : -1),
        		END: t.numberLiteral(ea.node.end  !== undefined ? ea.node.end : -1)
        	}))
        })
      } 
    }
  };
}