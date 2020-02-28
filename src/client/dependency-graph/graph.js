/*MD
# Dependency Graph

## Summary
This graph helps to find dependencies of [**href**] callexpressions by statically analysing the AST. It can be (and is) used to enhance the [**href**]`code mirror` and provide program comprehension for the programmer regarding active expressions.

## API
#### `resolveDependencies(location)`
Main entry for collecting the dependencies.
Takes the location of a callexpression.
Returns a `Set` of all nodes, that (may) change state touched by the callexpression.
Returns `undefined` if there is no callexpression at the given location

#### `_resolveDependencies(nodePath)`
See `resolveDependencies(location)` but takes the babel `nodePath` instead of a location.

## Not supported Syntax elements
* `delete object.property` - change from some value to undefined not found
* computed properties - just don't
* `this`
MD*/
import babelDefault from 'systemjs-babel-build';
import { range } from 'utils';
const { types: t } = babelDefault.babel;

export class DependencyGraph {
  
	get inner() { return this._inner }

	constructor(code) {
		this._inner = code.toAST();

		//Stores globally a `map` of properties (`String`) to objectbindings of the objects, that have a property of that name. 
		this.memberAssignments = new Map();
		this.enrich();
	}

	enrich() {
		let self = this;
		this._inner.traverseAsAST({
			enter(path) {
				path.node.extra = {
					// this in necessary due to possible circles
					// this collects the correct dependencies
					// breaks as soon as a node is contained by more than one circle (but this turned out to be unlikely)
					visited: 2,
					//same for return recursion
					returnVisited: 2
				};
			}
		});

		// adds the corresponding binding to every identifier
		this._inner.traverseAsAST({
			Scope(path) {
				Object.entries(path.scope.bindings).forEach(([_name, binding]) => {
					binding.referencePaths.forEach(path => {
						path.node.extra.binding = binding;
					})
				})
			}
		});

		// Filters every memberassignment and registers it in `this.memberAssignments`
		this._inner.traverseAsAST({
			MemberExpression(expr) {
				if (expr.node.computed) return;
				if (!expr.parentPath.isAssignmentExpression()) return;
        let assignment = self.assignedValue(expr.parentPath);

				let obj = expr.get("object");
				let objKey = obj.node.extra.binding || 'misc';
				let property = expr.get("property").node.name;

				let entry = self.memberAssignments.get(property);
				if (!entry) {
					// property unknown, adding new property and its accesses to the map
					let newMap = new Map();

					newMap.set(objKey, [assignment]);
					self.memberAssignments.set(property, newMap);
				} else {
					let objEntry = entry.get(objKey);
					if (!objEntry) {
						objEntry = [];
						entry.set(objKey, objEntry);
					}
					objEntry.push(assignment);
				}
			}
		});

		// adds bindings definend outside of the current scope(e.g. Function) to the scope
		this._inner.traverseAsAST({
			//  add scopable????
			'Function|ArrowFunctionExpression|Program'(path) {
				path.node.extra.leakingBindings = leakingBindings(path);
				const callExpressions = path.node.extra.callExpressions = [];
				const objects = path.node.extra.objects = new Map();
				const returns = path.node.extra.returns = [];

				path.traverse({
					MemberExpression(expr) {
						if (expr.parentPath.isAssignmentExpression()) return;
						let objExpr = expr.get("object").node;
						let property = expr.get("property").node.name;

						let entry = objects.get(objExpr);
						if (!entry) {
							objects.set(objExpr, new Set([property]));
						} else {
							entry.add(property);
						}
					}
				});

				path.traverse({
					ReturnStatement(ret) {
						if (ret.has("argument")) {
							returns.push(ret.get("argument"));
						}
					},
					CallExpression(call) {
						callExpressions.push(call)
					}
				})
			}
		});

		this._inner.traverseAsAST({
			Expression(expr) {
				self.collectExpressionInformation(expr);
			}
		});
    console.warn(this);
	}

	collectExpressionInformation(path) {
    //debugger;
		if (path.node.extra.returnVisited <= 0) {
			return [];
		}

		path.node.extra.returnVisited -= 1;

		if (path.node.extra.results) {
			return path.node.extra.results
		}

		let results = [];
    let resolvedObjects = [];

		if (path.isObjectExpression()) {
      resolvedObjects = [{objectExpression:path, bindings:new Set()}];

		} else if (path.isIdentifier()) {
			let binding = path.node.extra.binding;
			if (binding) {
				[binding.path, ...binding.constantViolations].forEach(item => {
					this.collectExpressionInformation(item);
					results.push(item.node.extra.results);
          item.node.extra.resolvedObjects.forEach(obj =>{
            obj.bindings.add(binding);            
            resolvedObjects.push(obj);            
          })
				})
			}
    
    } else if (path.isAssignmentExpression() || path.isVariableDeclarator()) {
          
			let val = this.assignedValue(path);
			this.collectExpressionInformation(val);
			results = val.node.extra.results;
      resolvedObjects = val.node.extra.resolvedObjects;

		} else if (path.isFunction()) {
			results = [path];

		} else if (path.isConditionalExpression()) {
			[path.get("consequent"), path.get("alternate")].forEach(expr => {
				this.collectExpressionInformation(expr);
				results.push(expr.node.extra.results);
        resolvedObjects.push(expr.node.extra.resolvedObjects);
			})

		} else if (path.isCallExpression()) {
			const callee = path.get("callee");
			let resolvedCallees = [];
			this.collectExpressionInformation(callee);
			callee.node.extra.results.forEach(func => {
				this.collectExpressionInformation(func);
				const body = func.get("body");
				if (!body.isBlockStatement()) {
					// slim arrow function        
					this.collectExpressionInformation(body);
					results.push(body.node.extra.results);
				} else {
					func.node.extra.returns.forEach(returnStatement => {
						this.collectExpressionInformation(returnStatement);
						results.push(returnStatement.node.extra.results);
            resolvedObjects.push(returnStatement.node.extra.resolvedObjects);
					})
				}
				// hey we found a callee as well. 
				resolvedCallees.push(func);
			})
			path.node.extra.resolvedCallees = resolvedCallees.flat();

		} else if (path.isMemberExpression()) {
			const objExpr = path.get("object");
			this.collectExpressionInformation(objExpr);
      
      // wir selbst wenn obj ein identifier ist?
      // FIND BINDINGS OF OBJ vie resolved OBJ hochbubbeln???

			let tmp = objExpr.node.extra.resolvedObjects.flat();
			tmp.forEach(result => {
				this.assignmentsOf(path.get("property").node.name, result).forEach(assignment => {
					this.collectExpressionInformation(assignment);
					results.push(assignment.node.extra.results);
          resolvedObjects.push(assignment.node.extra.resolvedObjects);
				})
			});
		}
    if ([...resolvedObjects, ...results].includes(undefined)) {
      //debugger;
    }
    path.node.extra.resolvedObjects = resolvedObjects.flat();
		path.node.extra.results = results.flat();
	}


	assignmentsOf(property, obj) {
    
    let result = [];
    this.shadowedBindings(obj.bindings).forEach(binding=>{
    
      let propertyEntry = this.memberAssignments.get(property) || new Map();
      let memberDependencies = propertyEntry.get("misc") || [];
      memberDependencies.forEach(assignment => result.push(assignment));

      let objEntry = propertyEntry.get(binding);
      if (objEntry) {
        objEntry.forEach(assignment => result.push(assignment))
      }
    });    
    
    // try to read as much from the given ObjectExpression as possible

		let objExpr = obj.objectExpression; // the nodePath
    if (objExpr && objExpr.isObjectExpression()){
      let tmp = objExpr
        .get("properties")
        .find(path => path.get("key").node.name === property);
      if(tmp) {
        if (tmp.isObjectProperty()) {
          result.push(tmp.get("value"));
        } else if (tmp.isObjectMethod()) {
          result.push(tmp);
        }
      }
    } else {
      console.error("what?", obj);
    }
		return result;
	}

	assignedValue(path) {
		if (path.isFunctionDeclaration()) return path;
		if (path.isAssignmentExpression()) return path.get("right");
		if (path.isVariableDeclarator()) {
			const id = path.get("id");
			if (id.isPattern()) return; // #TODO
			return path.get("init");
		}
		return;
	}
  
  shadowedBindings(bindings) {
    /*ATTENTNION: some bindings shadow others, so instead of using the actual binding `b`, we use every binding `b` resolves to (including `b`)
     * 
     * //Where is b changed?
     * let a = {x:1};
     * let b = a; // a is shadowed binding
     * a.x = 2; //<--!!!
     * //b is equal to {x:2}
     */
    
    /* this should be stored in the members map or in an extra property. 
    * DOES NOT DETECT DEPENDENCIES THROUGH SIMPLE ASSIGNMENTS (a la `a = b`)
    * do this with extra sweep as last enrichment step, when the new property in there
    */
    let result = bindings;
    bindings.forEach(binding=>{
      binding.path.node.extra.resolvedObjects.forEach(obj=>{
        if(obj.bindings) {
          obj.bindings.forEach(item => result.add(item));
        }
      })
    });
    
    return result;
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
		const self = this;
		if ((path.node.extra.visited -= 1) <= 0) {
			return path.node.extra.dependencies || new Set();
		}

		if (path.node.extra.dependencies) {
			// the dependencies were already collected... just return them
			return path.node.extra.dependencies
		}

		let dependencies = new Set([...this.shadowedBindings(path.node.extra.leakingBindings)].map(binding => [...binding.constantViolations]).flat());
		path.node.extra.callExpressions.forEach(callExpression => {
			callExpression.node.extra.resolvedCallees.forEach(callee => {
				if (t.isFunction(callee)) {
					this._resolveDependencies(callee).forEach(dep => dependencies.add(dep));
				}

				if (t.isAssignmentExpression(callee)) {
					const value = this.assignedValue(callee);
					if (t.isFunction(value) || t.isArrowFunctionExpression(value)) {
						this._resolveDependencies(value).forEach(dep => dependencies.add(dep));
					}
				}

				if (t.isVariableDeclarator(callee)) {
					//???
					//console.error(callee);
				}
			})
		});

		if (path.node.extra.objects.size) {
			for (const [objExpr, members] of path.node.extra.objects.entries()) {
				for (const member of members) {
            self.assignmentsOf(member, {bindings: new Set([objExpr.extra.binding])}).forEach(assignment => {
						dependencies.add(assignment)
					});
				}
			}
		}
		path.node.extra.dependencies = dependencies;
		return dependencies;
	}
}
/*MD
# Helper
MD*/
const AEXPR_IDENTIFIER_NAME = 'aexpr';

function leakingBindings(path) {
	const bindings = new Set;
	path.traverse({
		ReferencedIdentifier(id) {
			const outerBinding = path.scope.getBinding(id.node.name);
			if (!outerBinding) return;
			const actualBinding = id.scope.getBinding(id.node.name);
			if (outerBinding === actualBinding) {
				bindings.add(actualBinding);
			}
		}
	});
	return bindings;
}

function isAExpr(path) {
	return t.isCallExpression(path)
		&& t.isIdentifier(path.node.callee)
		&& path.node.callee.name === AEXPR_IDENTIFIER_NAME
		&& !path.scope.hasBinding(AEXPR_IDENTIFIER_NAME, true);
}