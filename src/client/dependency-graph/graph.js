import babelDefault from 'systemjs-babel-build';
import { isAExpr, leakingBindings } from 'src/client/dependency-graph/ast-utils.js';
import { range } from 'utils';
const { types: t } = babelDefault.babel;

/*Dependency Graph*/

export class DependencyGraph {

  get inner() { return this._inner }

  constructor(code) {
    this._inner = code.toAST();
    this.enrich();
  }

  enrich() {
    this._inner.traverseAsAST({
      enter(path) {
        path.node.extra = {
          // this in necessary due to possible circles
          // this collects the correct dependencies
          visited: 2
        };
      }
    });


    this._inner.traverseAsAST({
      Scope(path) {
        Object.entries(path.scope.bindings).forEach(([_name, binding]) => {
          binding.referencePaths.forEach(path => {
            path.node.extra.binding = binding;
          })
        })
      }
    });

    this._inner.traverseAsAST({
      'Function|ArrowFunctionExpression'(path) {
        path.node.extra.leakingBindings = leakingBindings(path);
        path.node.extra.callExpressions = [];
        path.traverse({
          CallExpression(call) {
            path.node.extra.callExpressions.push(call)
          }
        })
      },
      CallExpression(path) {
        const callee = path.get("callee");
        if (t.isIdentifier(callee)) {
          const binding = callee.node.extra.binding;
          if (!binding) {
            return;
          }
          path.node.extra.resolvedCallees = [binding.path, ...binding.constantViolations];

        } else {
          if (t.isMemberExpression(callee)) {
            // #TODO: resolve member expressions
          }
          path.node.extra.resolvedCallees = [];
        }
      }
    }
    );
  }

  assignedValue(path) {
    if (path.isFunctionDeclaration()) return path;
    if (path.isAssignmentExpression()) return path.get("right");
    if (path.isVariableDeclarator()) {
      const id = path.get("id");
      if (id.isPattern()) return; // TODO
      return path.get("init");
    }
    return;
  }

  resolveDependencies(location) {

    let node;
    let dep;
    let dependencyGraph = this;
    this._inner.traverseAsAST({
      CallExpression(path) {
        if (isAExpr(path) && range(path.node.loc).contains(location)) {
          if (path.node.dependencies != null) {
            dep = path.node.dependencies;
            console.log("dependencies already collected: ", dep);
            return;
          }
          path.node.extra.dependencies = dependencyGraph._resolveDependencies(path.get("arguments")[0]);
          node = path.node;
        }
      }
    });

    if (dep) {
      return dep
    }
    return node.extra.dependencies;
  }

  _resolveDependencies(path) {
    if ((path.node.extra.visited -= 1) <= 0) {
      return path.node.extra.dependencies || new Set();
    }

    if (path.node.extra.dependencies) {
      // the dependencies were already collected... just return them
      return path.node.extra.dependencies
    }

    let dependencies = new Set(path.node.extra.leakingBindings);
    path.node.extra.callExpressions.forEach(callExpression => {
      callExpression.node.extra.resolvedCallees.forEach(callee => {
        if (t.isFunction(callee)) {
          this._resolveDependencies(callee).forEach(dep => dependencies.add(dep));
        }

        console.error(callee);
        if (t.isAssignmentExpression(callee)) {
          const value = this.assignedValue(callee);
          if (t.isFunction(value) || t.isArrowFunctionExpression(value)) {
            this._resolveDependencies(value).forEach(dep => dependencies.add(dep));
          }
        }

        if (t.isVariableDeclarator(callee)) {
          //???
        }

      })

    })
    path.node.extra.dependencies = dependencies;
    return dependencies;
  }
}