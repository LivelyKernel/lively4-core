import { uuid as generateUUID } from 'utils'; 
import * as tr from 'src/components/demo/lively-whyline-tracing.js';
console.log(tr);
export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;
  let begin = template("__trace__.traceBeginNode(NODEID)")
  let end = template("__trace__.traceEndNode(NODEID)")
  let wrapBlockTemplate = template(`${'__trace__'}.${'exp'}(ID,() => BLOCK)`);
  let wrapValueTemplate = template(`${'__trace__'}.${'val'}(ID,EXP)`);

  let checkRuntime = template('if (performance.now() - _tr_time > _tr_time_max) throw new Error("Running too long! Endless loop?");')

  return {
    name: "ast-transform", // not required
    manipulateOptions(opts, parserOpts) {
      parserOpts.sourceType = "module";
    },
    visitor: { 
      Program(path) {
        /*
         * Traverse AST to add shared properties / transformations
         */
        function isVariableAccess(identifier) {
          let badKeys = ['left', 'key', 'id', 'label', 'param', 'local', 'exported', 'imported', 'property', 'meta'];
          return (
            !t.isFunction(identifier.parent)
            && !t.isUpdateExpression(identifier.parent)
            && (
              t.isBinaryExpression(identifier.parent)
              || !badKeys.includes(identifier.key)));
        }
        
        let idcounter = 0;
        
        path.traverse({
          enter(path) {
            path.node.traceid = idcounter++;
          },
          Identifier(path) {
            path.node.isVariableAccess = isVariableAccess(path);
            path.node.isDeclaration = path.scope.bindingIdentifierEquals(path.node.name, path.node);
            path.node.scopeId = path.scope.getBinding(path.node.name).scope.uid;
          }
        });
        
        /*
         * Create copy of original AST.
         * This copy will remain unaffected by the later transformation.
         */

        var programast = JSON.parse(JSON.stringify(path.node)); //create copy
        programast.astid = generateUUID();
        if (!window.__tr_ast_registry__) window.__tr_ast_registry__ = {};
        window.__tr_ast_registry__[programast.astid] = programast;

        /*
         * Create mapping between ids and unchanging AST
         */
        
        programast.node_map = [];

        traverse({"type": "File", "program": programast}, {
            enter(path) {
              let node = path.node;
              programast.node_map[node.traceid] = node;
              node.traceNodeType = tr.TraceNode.mapToNodeType(node);
            }
        })
        
        /*
         * Transform AST to include tracing
         */
        
        function shouldTrace(path) {
          let node = path.node
          if (!node.traceid || node.isTraced) {
            return false;
          } else {
            node.isTraced = true
            return true
          }
        }
        
        function wrapBlock(id, blockOrExp) {
          return wrapBlockTemplate({
            ID: t.numericLiteral(id),
            BLOCK: blockOrExp
          }).expression //Or do we ever actually prefer ExpressionStatement over Expression?
        }
        
        function wrapValue(id, exp) {
          return wrapValueTemplate({
            ID: t.numericLiteral(id),
            EXP: exp
          }).expression
        }
        
        path.traverse({
          'BinaryExpression|CallExpression|UnaryExpression|UpdateExpression|AssignmentExpression': {
            exit: (path) => {
              if (shouldTrace(path)) {
                let newNode = wrapBlock(path.node.traceid, path);
                path.replaceWith(newNode);
              }
            }
          },
          'VariableDeclarator': {
            exit: (path) => {
              if (shouldTrace(path)) {
                let init = path.get('init');
                if (init.node) {
                  let newNode = wrapBlock(path.node.traceid, init);
                  init.replaceWith(newNode);
                }
              }
            }
          },
          'IfStatement|ForStatement|WhileStatement': {
            exit: (path) => {
              if (shouldTrace(path)) {
                path.insertBefore(begin({
                  NODEID: t.numericLiteral(path.node.traceid)
                }));
                path.insertAfter(end({
                  NODEID: t.numericLiteral(path.node.traceid)
                }));
              }
            }
          },
          'FunctionDeclaration|FunctionExpression|ClassMethod': {
            exit: (path) => {
              if (shouldTrace(path)) {
                let body = path.get('body');
                let wrappedBody = wrapBlock(path.node.traceid, body);
                let newBody = t.blockStatement([
                  checkRuntime(),
                  t.returnStatement(wrappedBody)]);
                body.replaceWith(newBody);
              }
            }
          },
          'Identifier': (path) => {
            let node = path.node;
            if (node.isVariableAccess && shouldTrace(path)) {
              let newNode = wrapValue(node.traceid, path);
              path.replaceWith(newNode);
            }
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
      } 
    }
  };
}