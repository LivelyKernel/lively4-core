export default function (babel) {
  const { types: t, template, transformFromAst, traverse } = babel;

  return {
    name: "ast-transform",
    visitor: {
      StringLiteral(path) {
        if (path.isGenerated()) return;
        const contents = path.node.value;
        const newContents = contents.replace(/zz/g, "ff");
        const replacement = t.stringLiteral(newContents);
        path.replaceWith(replacement);
      }
    }
  };
}