export default function({types: t}) {    
    return {
        name: 'test',
        visitor: {
            Function(path) {
                if(path.node.alreadyVisited) {
                    return;
                }
                
                const returnNode = t.returnStatement(t.arrowFunctionExpression([], t.numericLiteral(5)));

                const node = t.functionDeclaration(
                    path.node.id, 
                    [], 
                    t.blockStatement([returnNode]));
                node.alreadyVisited = true;
                
                path.replaceWith(node);
            }
        }
    }
}