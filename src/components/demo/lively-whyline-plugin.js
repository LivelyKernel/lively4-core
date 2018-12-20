import { uuid as generateUUID } from 'utils'; 
import TraceNode from 'src/components/demo/lively-whyline-tracing.js'

var expressions
var statements
var declarators
var assignments
var functions
var loops

export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;
  let log = template("__trace__.traceNode(NODEID,() => EXPSTATE)")
  let begin = template("__trace__.traceBeginNode(NODEID)")
  let end = template("__trace__.traceEndNode(NODEID)")

  let checkRuntime = template('if (performance.now() - _tr_time > _tr_time_max) throw new Error("Running too long! Endless loop?");')

  return {
    name: "ast-transform", // not required
    manipulateOptions(opts, parserOpts) {
      parserOpts.sourceType = "module";
    },
    visitor: { 
      Program(path) {
        var idcounter = 0;

        expressions = []
        statements = []
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
          IfStatement(path) {statements.push(path)},
          AssignmentExpression(path) { assignments.push(path) },

          ForStatement(path) { loops.push(path) },
          WhileStatement(path) { loops.push(path) },
          
          Identifier(path){
            let currentScope = path.scope
            while(!currentScope.hasOwnBinding(path.node.name)){
              if(!currentScope.parent)
                return;
              currentScope = currentScope.parent
            }
              path.node.scopeId = currentScope.uid
          },


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
              programast.node_map[path.node.traceid] = path.node
              path.node.trace_counter = 0;
            }
        })	

        path.unshiftContainer('body', template(`
          var __tr_ast__ = window.__tr_ast_registry__[ASTID]

          var __trace__ = new window.lively4ExecutionTrace(__tr_ast__);

          var _tr_time = performance.now();
          var _tr_time_max = 1000;

    	  	__tr_ast__.calltrace = __trace__.traceRoot
          __tr_ast__.executionTrace = __trace__

    	  	window.__tr_last_ast__ = __tr_ast__`)({ASTID: t.stringLiteral(programast.astid)}));

        statements.forEach(ea => {
          ea.insertBefore(begin({
            NODEID: t.numericLiteral(ea.node.traceid)
          }));
          ea.insertAfter(end({
            NODEID: t.numericLiteral(ea.node.traceid)
          }));
        });

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
          body.replaceWith(template("{ return __trace__.traceNode( NODEIDX , () => BLOCK)}")({
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