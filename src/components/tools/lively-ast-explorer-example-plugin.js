
export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;

  return {
    name: "ast-transform", // not required
    visitor: {
      Identifier(path) {
        if (path.node.__done__) {
          return;
        }
        if (path.node.name !== 'foo') {
          return;
        }
        console.log(path.getAncestry().map(p=>p.type + ' ' + p.getSource()))
        path.node.__done__ = true;

        var thingy = path.find(p => {
          // return true
          const parentPath = p.parentPath;
          if (!parentPath) {
            return false;
          }

          function ensureBlock(body) {
            if (!body.node) return null;

            if (body.isBlockStatement()) {
              return body.node;
            }

            const statements = [];
            if (body.isStatement()) {
              statements.push(body.node);
            } else if (body.parentPath.isArrowFunctionExpression() && body.isExpression()) {
              statements.push(t.returnStatement(body.node));
            } else {
              throw new Error("I never thought this was even possible.");
            }

            const tBlockStatement = t.blockStatement;
            const tBlockStatementStatements = tBlockStatement(statements);
            const blockNode = tBlockStatementStatements;
            body.replaceWith(blockNode);
            return blockNode;
          }

          if (p.parentKey === 'body' && (parentPath.isFunction() || parentPath.isFor() || parentPath.isWhile())) {
            console.warn(p.parentKey === 'body', parentPath.isFunction(), parentPath.isFor(), parentPath.isWhile())
            ensureBlock(p);
            return true;
          }
          if (parentPath.isIfStatement() && (p.parentKey === 'consequent' || p.parentKey === 'alternate')) {
            ensureBlock(p);
            return true;
          }
        });
        path.replaceWith(t.identifier("hello"));
        const type = path.type
        console.log(path.getAncestry().map(p=>p.type + ' ' + p.getSource()))
        // debugger;
        let pp = path.getStatementParent();
        const decl = babel.template('const ID = INIT;')();
        pp.insertBefore(decl);
      }
    }
  };
}