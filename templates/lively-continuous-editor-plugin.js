import generateUUID from 'src/client/uuid.js'; 
import {babel} from 'systemjs-babel-build';

var expressions
var statements
var declarations
var declarators
var assignments
var functions
var loops

export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;
  let log = template("_tr_(NODEID,() => EXPSTATE)")
  let begin = template("_tr_begin_(NODEID)")
  let end = template("_tr_end_(NODEID)")
  let logstatement = template("_tr_log_(NODEID)")

  let checkRuntime = template('if (performance.now() - _tr_time > _tr_time_max) throw new Error("Run to long! Endless loop?");')

  return {
    name: "ast-transform", // not required
    visitor: { 
      Program(path) {
        var idcounter = 0;

        expressions = []
        statements = []
        declarations = []
        declarators = []
        assignments = []
        functions = []
        loops = []
        
        path.traverse({
        	enter(path) { 
        		path.node.traceid = idcounter++;

			    },
        	BinaryExpression(path) {expressions.push(path) },
        	CallExpression(path) {expressions.push(path)}, 
        	UnaryExpression(path) {expressions.push(path)},
        	UpdateExpression(path) {expressions.push(path)},
        	VariableDeclarator(path) { declarators.push(path) },
        	FunctionDeclaration(path) { functions.push(path) },
        	FunctionExpression(path) { functions.push(path) },

        	ClassMethod(path) { functions.push(path) },
        	ExpressionStatement(path) {statements.push(path) },
          AssignmentExpression(path) { assignments.push(path) },
        	
        	ForStatement(path) { loops.push(path) },
        	WhileStatement(path) { loops.push(path) },
        	
        	/* ... */
        });


        var astsrc= JSON.stringify(path.node)
        window.lastastsrc = astsrc
        var programast = JSON.parse(astsrc)
        programast.astid = generateUUID()
    		if (!window.__tr_ast_registry__) window.__tr_ast_registry__ = {};
    		window.__tr_ast_registry__[programast.astid]=programast
    
    		programast.node_map = []

    		traverse({"type": "File", "program": programast}, {
      			enter(path) {
      			  // console.log("enter " + path.node.type)
      				programast.node_map[path.node.traceid] = path.node
      				path.node.trace_counter = 0;
      			},
    		})	
			
	      path.unshiftContainer('body', template(`
	        var __tr_ast__ = window.__tr_ast_registry__[ASTID]

          var _tr_time = performance.now();
          var _tr_time_max = 1000;
	  		  function _tr_(id, exp) {
            var astnode =  __tr_ast__ .node_map[id]
  	  		  // console.log("enter " + astnode.type )

	  			  var callnode = {parent: __tr_current__, id: id, children: []}
				    callnode.parent.children.push(callnode)
	  			  __tr_current__=callnode
	  			  
  	  			var value = exp()

            callnode.id = id
  	  			callnode.value = value;
  	  			
  	  			__tr_current__ = callnode.parent
  	  			
  	  			return value
    	  	};
    	  	
    	  	
    	  	
    	  	function _tr_log_(id) {
            var astnode =  __tr_ast__ .node_map[id]
            // console.log("logst " + astnode.type )
            
            var callnode = {parent: __tr_current__, id: id, children: []}
				    callnode.parent.children.push(callnode)
    	  		
    	  	};
    	  	
    	  	function _tr_begin_(id) {
            var astnode =  __tr_ast__ .node_map[id]
            // console.log("begin " + astnode.type )
            
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
    	  	var __tr_current__=__tr_root__`)({ASTID: t.stringLiteral(programast.astid)}));
	  	
        statements.forEach(ea => {
       		ea.insertBefore(begin({
        		NODEID: t.numericLiteral(ea.node.traceid)
        	}));
        	ea.insertAfter(end({
        		NODEID: t.numericLiteral(ea.node.traceid)
        	}));
        });

        // declarations.forEach(ea => {
       	// 	ea.insertBefore(begin({
        // 		NODEID: t.numericLiteral(ea.node.traceid)
        // 	}))
        // 	ea.insertAfter(end({
        // 		NODEID: t.numericLiteral(ea.node.traceid)
        // 	}))
        // })
     
        assignments.forEach(ea => {
        	ea.replaceWith(log({
        	  NODEID: t.numericLiteral(ea.node.traceid),
        		EXPSTATE: ea
        	}));
        });
     
        declarators.forEach(ea => {
        	if (ea.node.init) {
          	ea.node.init  = log({
          	  NODEID: t.numericLiteral(ea.node.traceid),
          		EXPSTATE: ea.node.init
          	}).expression; // no statement here
        	}
        });

        // declarators.forEach(ea => {
        // 	if (ea.node.init) {
        //   	ea.get("init").replaceWith(log({
        //   	  NODEID: t.numericLiteral(ea.node.traceid),
        //   		EXPSTATE: ea.node.init
        //   	}));
        // 	}
        // });
        
        loops.forEach(ea => {
       		ea.insertBefore(begin({
        		NODEID: t.numericLiteral(ea.node.traceid)
        	}))
        	ea.insertAfter(end({
        		NODEID: t.numericLiteral(ea.node.traceid)
        	}))
        })

        loops.forEach(ea => {
            ea.get('body').unshiftContainer('body', checkRuntime())
        })

        functions.forEach(ea => {
        	var body = ea.get('body');
        	body.replaceWith(template("{ return _tr_( NODEIDX , () => BLOCK)}")({
        	  NODEIDX: t.numericLiteral(ea.node.traceid), BLOCK: body}))
        });

        functions.forEach(ea => {
            ea.get('body').unshiftContainer('body', checkRuntime())
        })

        expressions.forEach(ea => {
        	ea.replaceWith(log({
        	  NODEID: t.numericLiteral(ea.node.traceid),
        		EXPSTATE: ea
        	}))
        })
      } 
    }
  };
}