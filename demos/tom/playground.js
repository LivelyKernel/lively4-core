export default function({types: t, template}) {    
  return {
    name: 'demo',
    visitor: {
      Conditional(path) {
        const log = template('console.log("afterTest")')
        path.get('test')
          .insertAfter(log());
      },
            
      AssignmentExpression(path) {
        console.log(path.node.loc.start);
      }
    }
  }
}