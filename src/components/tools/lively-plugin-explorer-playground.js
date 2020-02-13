export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;
  const loggingFunc = template(`function __log__(result) {
  console.log(NAME, result);
  return result;
}`);
  const loggingCall = template(`__log__(EXPR)`);

  return {
    name: "return-logging",
    visitor: {
      FunctionDeclaration(path) {
        if (path.isGenerated()) return path.skip();
        const body = path.get("body");
        const name = path.node.id.name;
        body.unshiftContainer('body', loggingFunc({NAME: t.stringLiteral(name)}));
      },
      ReturnStatement(path) {
        const arg = path.get('argument');
        const expression = arg.node || t.identifier("undefined");
        const newNode = loggingCall({ EXPR: expression }).expression;
        arg.replaceWith(newNode);
      }
    }
  };
}