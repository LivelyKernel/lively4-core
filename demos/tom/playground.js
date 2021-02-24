export default function({types: t}) {    
    return {
        name: 'test',
        visitor: {
            Conditional(path) {
                debugger
                path.get('test').insertAfter(t.stringLiteral('afterTest'));
            },
            
            AssignmentExpression(path) {
                debugger
                path.node.loc.start
            }
        }
    }
}