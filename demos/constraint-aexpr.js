const IS_EXPLICIT_SCOPE_OBJECT = Symbol('FLAG: generated scope object');

export default function({ types: t, template, traverse }) {
    let getSolverInstance = template(`let solver = Cassowary.ClSimplexSolver.getInstance();`),
        addConstraint = template(`solver.addConstraint(linearEquation);`),
        triggerExpression = template(`trigger(aexpr(() => CONDITION)).onBecomeFalse(() => solver.solveConstraints())`),
        constraintVariableForName = template(`solver.getConstraintVariableFor(SCOPE, NAME, () => {
                                                let _constraintVar = new Cassowary.ClVariable(NAME, INIT);
                                                aexpr(() => ACCESSOR).onChange(val => _constraintVar.set_value(val));
                                                aexpr(() => _constraintVar.value()).onChange(val => ACCESSOR = val);
                                                return _constraintVar;
                                              })`);
                                    
    return {
        visitor: {
            Program: {
                enter(path, state) {
                    function getIdentifierForExplicitScopeObject(parentWithScope) {
                        let bindings = parentWithScope.scope.bindings;
                        let scopeName = Object.keys(bindings).find(key => {
                            return bindings[key].path &&
                                bindings[key].path.node &&
                                bindings[key].path.node.id &&
                                bindings[key].path.node.id[IS_EXPLICIT_SCOPE_OBJECT]
                        });

                        if(scopeName) {
                            return t.identifier(scopeName);
                        } else {
                            let uniqueIdentifier = parentWithScope.scope.generateUidIdentifier('scope');
                            uniqueIdentifier[IS_EXPLICIT_SCOPE_OBJECT] = true;

                            parentWithScope.scope.push({
                                kind: 'let',
                                id: uniqueIdentifier,
                                init: t.objectExpression([])
                            });
                            return uniqueIdentifier;
                        }
                    }

                    function getScopeIdentifierForVariable(path) {
                        if(path.scope.hasBinding(path.node.name)) {
                            let parentWithScope = path.findParent(par =>
                                par.scope.hasOwnBinding(path.node.name)
                            );
                            if(parentWithScope) {
                                return getIdentifierForExplicitScopeObject(parentWithScope);
                            }
                        } else {
                            return t.identifier('window');
                        }
                    }

                    path.traverse({
                        LabeledStatement(path) {
                            if(path.node.label.name !== 'always') { return; }

                            // identify all referenced variables
                            let variables = new Set();
                            path.traverse({
                                Identifier(path) {
                                    if(path.node.name === 'always') { return; }
                                    variables.add(path)
                                }
                            });

                            let constraintVariableConstructors = [];
                            let constraintVarsByVariables = new Map();

                            Array.from(variables).forEach(path => {
                                let name = path.node.name,
                                    scopeIdentifier = getScopeIdentifierForVariable(path),
                                    identifier = path.scope.generateUidIdentifier('constraintVar_' + name),
                                    constraintVariableConstructor = t.variableDeclaration('let', [
                                        t.variableDeclarator(
                                            identifier,
                                            constraintVariableForName({
                                                NAME: t.stringLiteral(name),
                                                SCOPE: scopeIdentifier,
                                                ACCESSOR: path.node,
                                                INIT: path.node
                                            }).expression
                                        )
                                    ]);

                                constraintVariableConstructors.push(constraintVariableConstructor);
                                constraintVarsByVariables.set(name, identifier);
                            });

                            function buildLinearEquation(node) {
                                if(t.isExpressionStatement(node)) {
                                    return buildLinearEquation(node.expression);
                                }
                                if(t.isBinaryExpression(node)) {
                                    if(['==', '==='].indexOf(node.operator) >= 0) {
                                        return t.callExpression(
                                            t.memberExpression(
                                                buildLinearEquation(node.left),
                                                t.identifier('cnEquals')
                                            ),
                                            [buildLinearEquation(node.right)]
                                        );
                                    } else if(node.operator === '+') {
                                        return t.callExpression(
                                            t.memberExpression(
                                                buildLinearEquation(node.left),
                                                t.identifier('plus')
                                            ),
                                            [buildLinearEquation(node.right)]
                                        );
                                    } else if(node.operator === '*') {
                                        let left = t.isIdentifier(node.left) ? node.left : node.right;
                                        let right = t.isIdentifier(node.right) ? node.left : node.right;
                                        return t.callExpression(
                                            t.memberExpression(
                                                buildLinearEquation(left),
                                                t.identifier('times')
                                            ),
                                            [buildLinearEquation(right)]
                                        );
                                    }
                                }
                                if(t.isIdentifier(node)) {
                                    return constraintVarsByVariables.get(node.name);
                                }
                                if(t.isNumericLiteral(node)) {
                                    return t.numericLiteral(node.value);
                                }
                                throw new Error(`unknown type in always statement: ${node.type}`);
                            }

                            let linearEquationConstruction = template(`let linearEquation = EQUATION;`)({ EQUATION: buildLinearEquation(path.node.body) });

                            function convertIntoObservable(node) {
                                if(t.isIdentifier(node)) {
                                    return template(`VAR_NAME.value()`)({ VAR_NAME: constraintVarsByVariables.get(node.name) }).expression;
                                }
                                if(t.isBinaryExpression(node)) {
                                    return t.binaryExpression(
                                        node.operator,
                                        convertIntoObservable(node.left),
                                        convertIntoObservable(node.right)
                                    )
                                }
                                return node;
                            }

                            path.replaceWith(t.blockStatement([
                                getSolverInstance(),
                                ...constraintVariableConstructors,
                                linearEquationConstruction,
                                addConstraint(),
                                triggerExpression({ CONDITION: convertIntoObservable(path.node.body.expression) })
                            ]))
                        }
                    });
                }
            }
        }
    };
}