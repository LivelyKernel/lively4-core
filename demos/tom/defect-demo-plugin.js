export default function({ types: t }) {
    return {
        name: 'demo-plugin',
        visitor: {
            
            Conditional(path) {
                const endNode = t.stringLiteral('after');
                path.get('test').insertAfter(endNode);
            },
            
            AssignmentExpression(path) {
                if(path.isGenerated()) {
                    return;
                }
                const position = t.numericLiteral(path.node.loc.start.line);
                path.insertBefore(position);
            }
            
        }
    }
}
































/*
if(path.isGenerated()) {
                    return;
                }
                */

