export default function({types: t}) {
    
    return {
        name: 'test',
        visitor: {
            CallExpression(path) {
                if (path.node.modified) {
                    return;
                }
                path.node.modified = true;
                
                path.node.callee.name = [...path.node.callee.name].reverse().join('');
            }
        }
    }
}