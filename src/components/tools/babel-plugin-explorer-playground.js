export default function({ types: t }) {
    return {
        name: 'test-plugin',
        visitor: {
            Program(path) {
                debugger;
              
                path.unshiftContainer('body', t.debuggerStatement());
                
            }
        }
    }
}