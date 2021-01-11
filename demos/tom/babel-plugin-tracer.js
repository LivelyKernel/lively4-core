import Trace from 'demos/tom/trace.js';
import wrapAST from 'demos/tom/wrapAST.js';

export default function({ types: t }) {
    function error(path, message) {
        throw path.buildCodeFrameError(message);
    }

    const returnVisitor = {
        ReturnStatement(path, state) {
            if (path.node.alreadyVisited) {
                return;
            }
            path.node.alreadyVisited = true;

            const returnValue = path.node.argument ? path.node.argument : t.identifier('undefined');
            const returnNode = callOnTrace('return', [location(path.node, state), returnValue]);
            path.node.argument = returnNode;
        }
    }

    function callOnTrace(methodName, args = [], shouldBeStatement = false) {
        let call = t.callExpression(t.memberExpression(t.identifier(Trace.traceIdenifierName), t.identifier(methodName)),
            args);
        if (shouldBeStatement) {
            call = t.expressionStatement(call);
        }
        return call;
    }

    function location(astNode, state) {
        const filename = state.file.opts.filename;

        const start = astNode.loc.start;
        const end = astNode.loc.end;

        const locationObject = {
            filename,
            startLine: start.line,
            startColumn: start.column,
            endLine: end.line,
            endColumn: end.column
        }

        const id = Trace.register(locationObject);

        return t.numericLiteral(id);
    }

    function modifyFunction(name, path, state) {
        const body = path.get('body');
        body.unshiftContainer('body', t.expressionStatement(callOnTrace('enterFunction', [location(path.node, state), t
            .stringLiteral(name)
        ])));
        body.pushContainer('body', t.expressionStatement(callOnTrace('leave', [location(path.node, state)])));
        path.traverse(returnVisitor, state);
    }

    function resolveName(callee) {
        if (callee.type === 'MemberExpression') {
            return resolveName(callee.object) + `.${callee.property.name}`;
        } else if (callee.type === 'CallExpression') {
            return resolveName(callee.callee);
        } else {
            return callee.name;
        }
    }

    function nameFromCallExpression(path) {
        const callee = path.node.callee;
        if (callee.type === 'MemberExpression') {
            return resolveName(callee)
        } else {
            return callee.name || 'anonymous function';
        }
    }

    return {
        name: 'tracer',
        visitor: {
            Program(path) {
                // wrapAST(path.node, {notify(){console.log(...arguments)}})
            },
            CallExpression(path) {
                if (path.node.alreadyVisited || path.isGenerated()) {
                    return;
                }


                path.node.alreadyVisited = true;
                let callee = path.get('callee');
                let name;

                if (t.isMemberExpression(callee)) {
                    callee.node.computed = true;
                    callee = path.get('callee.property');

                    name = callee.node.name || 'anonymous function';

                    const aboutToEnter = callOnTrace('aboutToEnter',
                        [
                            location(callee.node, this),
                            t.stringLiteral(name)
                        ]);
                    callee.replaceWith(t.stringLiteral(name));
                    callee.insertBefore(aboutToEnter);
                    return;
                } else if (t.isFunctionExpression(callee)) {
                    name = callee.node.id.name || 'anonymous function';
                } else { // identifier or anonymous
                    name = callee.node.name || 'anonymous function';
                }

                const aboutToEnter = callOnTrace('aboutToEnter',
                    [
                        location(callee.node, this),
                        t.stringLiteral(name)
                    ]);

                callee.insertBefore(aboutToEnter);


            },
            ArrowFunctionExpression(path) {

            },
            "ClassMethod|ObjectMethod"(path) {
                const name = path.node.key.name;
                modifyFunction(name, path, this);
            },
            "FunctionDeclaration|FunctionExpression"(path) {
                const id = path.node.id;
                const name = id ? id.name : 'anonymous function';
                modifyFunction(name, path, this);
            },
            Loop(path) {
                path.insertBefore(callOnTrace('beginLoop', [location(path.node, this), t.stringLiteral(path.type)]))
                path.insertAfter(callOnTrace('endLoop', [location(path.node, this)]))
            },
            ForStatement(path) {
                path.get('body').unshiftContainer('body', callOnTrace('nextLoopIteration', [location(path.node, this),
                    ...path.node.init.declarations.map(declaration => declaration.id)
                ]));
            },
            ForOfStatement(path) {

            },
            ForInStatement(path) {

            },
            Conditional(path) {
                if (path.node.alreadyVisited) {
                    return;
                }

                path.node.alreadyVisited = true;

                path.node.test = callOnTrace('conditionTest', [
                    location(path.node.test, this),
                    path.node.test
                ]);

                // do not log else ifs
                if (path.parent.type !== 'IfStatement') {
                    path.insertBefore(callOnTrace('beginCondition', [
                        location(path.node, this),
                        t.stringLiteral(path.type)
                    ]));
                    path.insertAfter(callOnTrace('endCondition', [location(path.node, this)]));
                }
            },

            AssignmentExpression(path) {
                if (path.isGenerated()) {
                    return;
                }
                path.node.right = callOnTrace('assignment', [
                    location(path.node, this),
                    t.stringLiteral(resolveName(path.node.left)), path.node.right
                ]);
            }
        }
    }
}
