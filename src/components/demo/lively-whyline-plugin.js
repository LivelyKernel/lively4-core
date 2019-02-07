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
        
        function isLiteralAccess(literal) {
          let badKeys = ['key', 'source'];
          return !badKeys.includes(literal.key);
        }
        
        let idcounter = 0;
        
        path.traverse({
          enter(path) {
            path.node.traceid = idcounter++;
          },
          Identifier(path) {
            path.node.isVariableAccess = isVariableAccess(path);
            path.node.isDeclaration = path.scope.bindingIdentifierEquals(path.node.name, path.node);
            let binding = path.scope.getBinding(path.node.name);
            path.node.scopeId = binding ? binding.scope.uid : null;
          },
          Literal(path) {
            path.node.isLiteralAccess = isLiteralAccess(path);
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
         * Do stuff with unchanging AST.
         * This doesn't affect the actual transformation.
         */
        
        programast.node_map = [];

        traverse({"type": "File", "program": programast}, {
            enter(path) {
              let node = path.node;
              programast.node_map[node.traceid] = node;
              node.traceNodeType = tr.TraceNode.mapToNodeType(node);
              node.parent = path.parent;
            }
        })
        
        /*
         * Utility functions
         */
        
        function shouldTrace(path) {
          let node = path.node
          if ((node.traceid === undefined) || node.isTraced) {
            return false;
          } else {
            return node.isTraced = true
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
        
        function ensureBlock(body) {
          if (!body.node) return null;
          
          if (body.isBlockStatement()) {
            return body.node;
          }

          const statements = [];
          if (body.isStatement()) {
            statements.push(body.node);
          } else {
            throw new Error("I never thought this was even possible.");
          }
          
          const blockNode = t.blockStatement(statements);
          body.replaceWith(blockNode);
          return blockNode;
        }
        
        function convertToComputed(memberExp) {
          const node = memberExp.node
          if (!node) return;
          if (node.computed) return;
          if (t.isIdentifier(node.property)) {
            node.property = t.stringLiteral(node.property.name);
            node.computed = true;
          } else {
            //but why though?
            throw new Error("Failed to convert MemberExpression");
          }
        }
        
        /*
         * Preprocess AST
         */
        
        path.traverse({
          'IfStatement': {
            enter(path) {
              ensureBlock(path.get("consequent"));
              ensureBlock(path.get("alternate"));
            }
          },
          'For|While|Function': {
            enter(path) {
              ensureBlock(path.get("body"));
            }
          },
          'MemberExpression': {
            enter(path) {
              convertToComputed(path);
            }
          }
        })
        
        /*
         * Transform AST to include tracing
         */
        
        path.traverse({
          'BinaryExpression|CallExpression|UnaryExpression|UpdateExpression|AssignmentExpression': {
            exit(path) {
              if (shouldTrace(path)) {
                let newNode = wrapBlock(path.node.traceid, path);
                path.replaceWith(newNode);
              }
            }
          },
          'VariableDeclarator': {
            exit(path) {
              if (shouldTrace(path)) {
                let init = path.get('init');
                if (init.node) {
                  let newNode = wrapBlock(path.node.traceid, init);
                  init.replaceWith(newNode);
                }
              }
            }
          },
          'IfStatement|ForStatement|While': {
            enter(path) {
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
          'Function': {
            enter(path) {
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
          'Identifier': {
            exit(path) {
              let node = path.node;
              if (node.isVariableAccess && shouldTrace(path)) {
                let newNode = wrapValue(node.traceid, path);
                path.replaceWith(newNode);
              }
            }
          },
          'Literal': {
            exit(path) {
              let node = path.node;
              if (node.isLiteralAccess && shouldTrace(path)) {
                let newNode = wrapValue(node.traceid, path);
                path.replaceWith(newNode);
              }
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