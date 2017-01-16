const RESULT_IDENTIFIER = '__result__';

export default function({ types: t }) {
  return {
    visitor: {
      Program(path) {
        const statements = path.get('body');
        if(statements.length <= 0) return;
        const finalStatement = statements[statements.length-1];
        const expr = finalStatement.get('expression');
        finalStatement.replaceWith(t.variableDeclaration('const', [
          t.variableDeclarator(t.identifier('__result__'), expr.node)
        ]));
        console.log(finalStatement, t.isExpressionStatement(finalStatement));

        path.pushContainer('body', t.exportNamedDeclaration(null, [
          t.exportSpecifier(
            t.identifier(RESULT_IDENTIFIER),
            t.identifier(RESULT_IDENTIFIER)
          )
        ]));
      }
    }
  };
}
