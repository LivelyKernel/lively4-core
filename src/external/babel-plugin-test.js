export default function(param) {
  let { types: t, template, traverse, } = param;
  return {
    visitor: {
      Program: {
        enter(path, state) {
          let statements = [];
          path.traverse({
            Statement: path => {
              statements.push(path);
            }
          });
           
          statements.forEach(path => path.replaceWithMultiple([
            t.expressionStatement(t.stringLiteral("Is this the real life?")),
            t.expressionStatement(t.stringLiteral("Is this just fantasy?"))
          ]))
        }
      }
    }
  };
}