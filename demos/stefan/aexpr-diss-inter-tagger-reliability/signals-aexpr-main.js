export default function({ types: t, template, traverse, }) {
    var setup = template(`
var aexprCallbacks = [],
    signals = [],
    solveSignals = false,
    resolveSignals = function() {
        if(!solveSignals) {
            solveSignals = true;
            signals.forEach(s => s());
            solveSignals = false;
            let nonSignalCB;
            while(nonSignalCB = aexprCallbacks.pop()) {
                nonSignalCB();
            }
        }
    },
    newAExpr = function(axp) {
        return {
            onChange(cb) {
                axp.onChange(val => {
                    if(solveSignals) {
                        aexprCallbacks.push(() => cb(axp.getCurrentValue()));
                    } else {
                        return cb(val);
                    }
                });
            }
        }
    }
`);
    var signal = template(`(aexpr(() => init).onChange(resolveSignals), signals.push(() => name = init), init)`);

    return {
        visitor: {
            Program(program) {
                let aexprs = new Set();
                program.traverse({
                    CallExpression(path) {
                        let callee = path.get("callee");
                        if(callee.isIdentifier() && callee.node.name === 'aexpr')
                            aexprs.add(path);
                    }
                });
                aexprs.forEach(path => path.replaceWith(template(`newAExpr(expr)`)({ expr: path.node })));

                program.traverse({
                    Identifier(path) {
                        if(!path.parentPath.isVariableDeclarator()) { return; }

                        // const as substitute for 'signal' for now #TODO
                        var declaration = path.parentPath.parentPath.node;
                        if(declaration.kind !== 'const') {return; }
                        declaration.kind = 'let';

                        var init = path.parentPath.get('init');
                        init.replaceWith(signal({
                            init: init,
                            name: path.node
                        }).expression);
                    }
                });

                program.unshiftContainer("body", setup());
            }
        }
    };
}