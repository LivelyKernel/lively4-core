export default function({types: t}) {    
    return {
        name: 'test',
        visitor: {
            Conditional(path) {
                debugger
                const string = t.stringLiteral('afterTest');
                path.get('test')
                    .insertAfter(string);
            },
            
            AssignmentExpression(path) {
                console.log(path.node.loc.start);
            }
        }
    }
}