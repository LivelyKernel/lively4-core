export default function({ types: t }) {
  return {
    name: 'assignment-plugin',
    visitor: {
      AssignmentExpression(path) {
        console.log(path.node.loc.start);
      }
    }
  }
}
