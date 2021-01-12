export default function({ types: t }) {
    return {
        name: 'demo-plugin',
        visitor: {
            Conditional(path) {
                const startNode = t.stringLiteral('start');
                const endNode = t.stringLiteral('after');
                path.get('test').insertBefore(startNode);
                path.get('test').insertAfter(endNode);
            },
            AssignmentExpression(path) {
                console.log(path.node.left.name)
            }
        }
    }
}