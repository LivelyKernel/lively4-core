export default function({ types: t, template, traverse, }) {
    var setup = template(`
var signals = []`);
    var signal = template(`(aexpr(() => init).onChange(resolveSignals), init)`);

    return {
        visitor: {
            Program(program) {
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