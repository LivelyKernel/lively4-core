export default function({ types: t }) {
  return {
    name: 'condition-plugin',
    visitor: {
      Conditional(path) {
        debugger
        const string = t.stringLiteral('afterTest');
        path.get('test')
          .insertAfter(string);
      }
    }
  }
}
