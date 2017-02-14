export default function (babel) {
  const { types: t, template, transformFromAst } = babel;
  
  
  let log = template("_tr_(NAME,EXPSTATE)")
  
  return {
    name: "ast-transform", // not required
    visitor: { 
      Program(path) {
      	
        var statements = []
        path.traverse({
        	Expression(path) {
            	statements.push(path)
            }
        });

		// IDEA can we make the whole program async by using generators?
	  	path.unshiftContainer('body', template(`function* _tr_(code, value) {
	  			console.log(code + " -> " + value)
	  		
	  			yield value
	  	};`)())

       //	path.unshiftContainer('body', t.stringLiteral("xxxx"))

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
        		NAME: t.stringLiteral("" + ast.code)
        	}))
        })
      } 
    }
  };
}