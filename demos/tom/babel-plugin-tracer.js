import Trace from 'demos/tom/trace.js';

export default function({ types: t }) {
    function error(path, message) {
        throw path.buildCodeFrameError(message);
    }

    const returnVisitor = {
        ReturnStatement(path) {
            if (path.node.alreadyVisited) {
                return;
            }
            path.node.alreadyVisited = true;
            const log = callOnTrace('return');
            const returnValue = path.node.argument ? path.node.argument : t.identifier('undefined');
            path.node.argument = t.sequenceExpression([log, returnValue])
        }
    }

    function callOnTrace(methodName, args = []) {
        return t.callExpression(t.memberExpression(t.identifier(Trace.traceIdenifierName), t.identifier(methodName)),
            args);
    }

    function modifyFunction(name, path) {
        const body = path.get('body');
        body.unshiftContainer('body', t.expressionStatement(callOnTrace('enterFunction', [t.stringLiteral(name)])));
        body.pushContainer('body', t.expressionStatement(callOnTrace('leave')));
        path.traverse(returnVisitor);
    }

    function resolveName(callee) {
        if(callee.type === 'MemberExpression') {
            return resolveName(callee.object) + `.${callee.property.name}`;
        } else if(callee.type === 'CallExpression') {
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
            CallExpression(path) {
                if (path.node.alreadyVisited || path.isGenerated()) {
                    return;
                }
                debugger
                const name = nameFromCallExpression(path);
                path.node.alreadyVisited = true;
                const log = callOnTrace('aboutToEnter', [t.stringLiteral(name)]);
                const sequence = t.sequenceExpression([log, path.node]);
                path.replaceWith(t.expressionStatement(sequence));
            },
            ArrowFunctionExpression(path) {

            },
            "ClassMethod|ObjectMethod"(path) {
                const name = path.node.key.name;
                modifyFunction(name, path);
            },
            "FunctionDeclaration|FunctionExpression"(path) {
                const id = path.node.id;
                const name = id ? id.name : 'anonymous function';
                modifyFunction(name, path);
            }
        }
    }
}
