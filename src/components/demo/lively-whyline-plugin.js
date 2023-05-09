import { uuid as generateUUID } from 'utils'; 
import * as tr from 'src/components/demo/lively-whyline-tracing.js';
export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;
  const traceReference = '__tr__';
  const begin = template(`${traceReference}.stmt(NODEID)`);
  const statementEnd = template(`${traceReference}.end()`);
  const assignmentTemplate = template(`${traceReference}.MSG(ID,() => BLOCK,() => VARS)`);
  const functionTemplate = template(`${traceReference}.MSG(ID, VARS)`);
  const declarationTemplate = template(`${traceReference}.MSG(ID, VARS)`);
  const wrapBlockTemplate = template(`${traceReference}.MSG(ID,() => BLOCK)`);
  const wrapValueTemplate = template(`${traceReference}.MSG(ID,EXP)`);

  const checkRuntime = template('if (performance.now() - _tr_time > _tr_time_max) throw new Error("Running too long! Endless loop?");')

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
          const badKeys = ['left', 'key', 'id', 'label', 'param', 'local', 'exported', 'imported', 'meta', 'property'];
          const parent = identifier.parent;
          if (t.isBinaryExpression(parent)
              || (t.isMemberExpression(parent) && parent.computed)) return true;
          if (t.isUpdateExpression(parent)
              //|| t.isFunction(parent)
              //|| (t.isObjectProperty(parent) && t.isObjectPattern(parent.parent))
              //|| t.isType(parent, "PatternLike")
              || badKeys.includes(identifier.key)) return false;
          return true;
        }
        
        function isLiteralAccess(literal) {
          const badKeys = ['key', 'source'];
          const parent = literal.parent
          if (t.isObjectProperty(parent) && parent.computed) return true;
          return !badKeys.includes(literal.key);
        }
        
        const patternVisitor = {
          enter(path) {
            path.skipKey("decorators");
          },
          'Identifier|MemberExpression': {
            enter(path) {
              this.push(path.node);
              path.skip();
            }
          },
          'AssignmentPattern': {
            enter(path) {
              path.skipKey("right");
            }
          },
          'ObjectProperty': {
            enter(path) {
              path.skipKey("key");
            }
          }
        }
        
        function gatherAssignmentTargets(pattern, array) {
          if (t.isIdentifier(pattern.node) || t.isMemberExpression(pattern.node)) {
            array.push(pattern.node);
          } else {
            pattern.traverse(patternVisitor, array);
          }
          array.forEach((node) => node.isAssignmentTarget = true);
        }
        
        let idcounter = 0;
        const scopes = [];
        
        path.traverse({
          enter(path) {
            /******/
            const uid = path.scope.uid;
            if (!scopes[uid]) scopes[uid] = [];
            scopes[uid].push(path.node);
            /******/
            path.node.traceid = idcounter++;
          },
          Identifier(path) {
            const id = path.node;
            id.isVariableAccess = !id.isAssignmentTarget && isVariableAccess(path);
            id.isDeclaration = path.scope.bindingIdentifierEquals(path.node.name, path.node);
            let binding = path.scope.getBinding(path.node.name);
            path.node.scopeId = binding ? binding.scope.uid : null;
          },
          Literal(path) {
            path.node.isLiteralAccess = isLiteralAccess(path);
          },
          VariableDeclarator(path) {
            gatherAssignmentTargets(path.get("id"), path.node.assignmentTargets = []);
          },
          AssignmentExpression(path) {
            gatherAssignmentTargets(path.get("left"), path.node.assignmentTargets = []);
          },
          Function(path) {
            const assignmentTargets = path.node.assignmentTargets = [];
            path.get("params").forEach((pattern) => {
              gatherAssignmentTargets(pattern, assignmentTargets);
            });
          }
        });
        
        /*****/
        console.log(scopes)
        /*****/
        
        /*
         * Create copy of original AST.
         * This copy will remain unaffected by the later transformation.
         * WARNING: Object identity is lost for objects referenced multiple times (e.g. assignmentTargets)
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
              node.parent = path.parent; //convencience for inspecting the resulting ast
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
        
        function wrapBlock(id, blockOrExp, message = 'exp') {
          return wrapBlockTemplate({
            ID: t.numericLiteral(id),
            BLOCK: blockOrExp.node ? blockOrExp.node : blockOrExp,
            MSG: t.identifier(message)
          }).expression //Or do we ever actually prefer ExpressionStatement over Expression?
        }
        
        function wrapValue(id, exp, message = 'val') {
          return wrapValueTemplate({
            ID: t.numericLiteral(id),
            EXP: exp.node,
            MSG: t.identifier(message)
          }).expression
        }
        
        function arrayOfArgs(vars) {
          return t.arrayExpression(vars.map((arg) => t.isIdentifier(arg) ? arg : t.nullLiteral()));
        }
        
        function wrapAssignment(id, exp, vars, message='asgn') {
          return assignmentTemplate({
            ID: t.numericLiteral(id),
            BLOCK: exp.node,
            VARS: arrayOfArgs(vars),
            MSG: t.identifier(message)
          }).expression;
        }
        
        function functionStart(id, vars, message='func') {
          return functionTemplate({
            ID: t.numericLiteral(id),
            VARS: arrayOfArgs(vars),
            MSG: t.identifier(message)
          });
        }
        
        function declaratorFollowup(id, vars, message='decl') {
          return declarationTemplate({
            ID: t.numericLiteral(id),
            VARS: arrayOfArgs(vars),
            MSG: t.identifier(message)
          });
        }
        
        function statementBegin(id) {
          return begin({
            NODEID: t.numericLiteral(id)
          });
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
          }
        })
        
        /*
         * Transform AST to include tracing
         */
        console.log(programast);
        path.traverse({
          /*enter(path) {
            console.log(`enter ${path.node.traceid}`);
          },
          exit(path) {
            console.log(`exit ${path.node.traceid}`);
          },*/
          'BinaryExpression|CallExpression|UnaryExpression|ObjectExpression|UpdateExpression|ArrayExpression|NewExpression|ConditionalExpression': {
            exit(path) {
              if (shouldTrace(path)) {
                const newNode = wrapBlock(path.node.traceid, path);
                path.replaceWith(newNode);
              }
            }
          },
          'AssignmentExpression': {
            exit(path) {
              if (shouldTrace(path)) {
                const node = path.node;
                const newNode = wrapAssignment(node.traceid, path, node.assignmentTargets);
                path.replaceWith(newNode);
              }
            }
          },
          'VariableDeclaration': {
            enter(path) {
              if (shouldTrace(path) && !t.isFor(path.parent)) {
                path.insertBefore(statementBegin(path.node.traceid));
                path.insertAfter(statementEnd());
              }
            }
          },
          'VariableDeclarator': {
            enter(path) {
              if (shouldTrace(path)) {
                const node = path.node;
                const declaration = path.parentPath;
                const init = path.get('init');
                const newNode = wrapBlock(node.traceid, init.node || t.identifier("undefined"));
                init.replaceWith(newNode);
                const followUp = declaratorFollowup(node.traceid, node.assignmentTargets);
                if (!t.isFor(declaration.parent)) {
                  declaration.insertAfter(followUp);
                } else {
                  const uid = t.identifier(declaration.scope.generateUid("decl"));
                  path.insertAfter(t.variableDeclarator(uid, followUp.expression));
                }
              }
            }
          },
          'IfStatement': {
            exit(path) {
              if (shouldTrace(path)) {
                path.insertBefore(statementBegin(path.node.traceid));
                path.insertAfter(statementEnd());
              }
            }
          },
          'For|While': {
            exit(path) {
              if (shouldTrace(path)) {
                path.get("body").unshiftContainer("body", checkRuntime());
                path.insertBefore(statementBegin(path.node.traceid));
                path.insertAfter(statementEnd());
              }
            }
          },
          'BlockStatement': {
            enter(path) {
              if (shouldTrace(path)) {
                const parent = path.parent;
                if (t.isFunction(parent) || t.isCatchClause(parent) || t.isTryStatement(parent)) return;
                console.log(path.node);
                path.unshiftContainer("body", statementBegin(path.node.traceid));
                path.pushContainer("body", statementEnd());
              }
            }
          },
          'Function': {
            enter(path) {
              if (shouldTrace(path)) {
                const node = path.node;
                const body = path.get("body");
                body.unshiftContainer("body", checkRuntime());
                body.unshiftContainer("body", functionStart(node.traceid, node.assignmentTargets));
                body.pushContainer("body", statementEnd());
              }
            }
          },
          'Identifier': {
            exit(path) {
              const node = path.node;
              if (shouldTrace(path) && node.isVariableAccess) {
                const newNode = wrapValue(node.traceid, path);
                path.replaceWith(newNode);
              }
            }
          },
          'Literal': {
            exit(path) {
              const node = path.node;
              if (shouldTrace(path) && node.isLiteralAccess) {
                const newNode = wrapValue(node.traceid, path);
                path.replaceWith(newNode);
              }
            }
          },
          'MemberExpression': {
            exit(path) {
              if (shouldTrace(path) && !path.node.isAssignmentTarget) {
                const newNode = wrapBlock(path.node.traceid, path);
                path.replaceWith(newNode);
              }
            }
          },
          'ReturnStatement': {
            exit(path) {
              if (shouldTrace(path)) {
                const arg = path.get('argument');
                const newNode = wrapBlock(path.node.traceid, arg.node || t.identifier("undefined"), 'rtrn');
                arg.replaceWith(newNode);
              }
            }
          }
        })

        path.unshiftContainer('body', template(`
          const __tr_ast__ = window.__tr_ast_registry__[ASTID]

          const ${traceReference} = new window.lively4ExecutionTrace(__tr_ast__);

          const _tr_time = performance.now();
          const _tr_time_max = 1000;

    	  	__tr_ast__.calltrace = ${traceReference}.traceRoot
          __tr_ast__.executionTrace = ${traceReference}

    	  	window.__tr_last_ast__ = __tr_ast__`)({ASTID: t.stringLiteral(programast.astid)}));
      } 
    }
  };
}