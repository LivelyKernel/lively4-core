export default function({ types: t }) {
    return {
        name: 'demo-plugin',
        visitor: {
            Conditional(path) {
                path.get('test').insertBefore(t.stringLiteral('start'));
                path.get('test').insertAfter(t.stringLiteral('after'));
            },
            AssignmentExpression(path) {
                alert(path.node.left.name)
            }
        }
    }
}