export default function({types: t}) {
    
    return {
        name: 'test',
        visitor: {
            CallExpression(path) {
                if (path.node.modified) {
                    return;
                }
                path.node.modified = true;
                
                path.node.callee.name = 'test_' +  path.node.callee.name;               
            }
        }
    }
}