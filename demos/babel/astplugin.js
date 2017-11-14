
export default function (babel) {
  const { types: t, template, transformFromAst } = babel;
  return {
    name: "ast-transform", // not required
    visitor: {
			      Program(){
             
            }
    }
  };
}

