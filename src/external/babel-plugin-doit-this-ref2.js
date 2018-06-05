const GLOBAL_THIS_REPLACEMENT = '__global_this__';

export default function(param) {
  let { types: t, template, traverse, } = param;
  return {
    visitor: {
       Program(program, { file }) {
        const DOIT_MATCHER = /^workspace(async)?(js)?:/;
        const MODULE_MATCHER = /.js$/;
        let filename = file.log.filename;
        
        // BEGIN Test Data
        filename = "workspacejs:foobar"
        if (window.__pluginDoitThisRefs__) {
          window.__pluginDoitThisRefs__ = {}
        }
        window.__pluginDoitThisRefs__["foobar"] = {a:3, b:4};
        // END Test Data
         
        let globalThis;
        // <browse://src/client/bound-eval.js> knows about this, should we define the "magic name" here or there? #SWA
        if(window.__pluginDoitThisRefs__ && DOIT_MATCHER.test(filename) && !MODULE_MATCHER.test(filename)) {
          var codeId = filename.replace(DOIT_MATCHER,"") // workspace: becomes workspacejs... e.g. and we are only interested in the id ...
          globalThis = window.__pluginDoitThisRefs__[codeId];
          console.log("boundEval this: " + globalThis + " codeId: " + codeId)
          // var thisVarDeclaration = t.variableDeclaration("var",
          //                             [ t.variableDeclarator(t.identifier(GLOBAL_THIS_REPLACEMENT)) ])
          const thisVarDeclaration = template(`var ${GLOBAL_THIS_REPLACEMENT} = window.__pluginDoitThisRefs__["${codeId}"]`)
          program.unshiftContainer('body', thisVarDeclaration());
        }
      },
      ThisExpression(path) {
        // are we in a 'this'-capturing scope?
        if(path.findParent(parent => t.isObjectMethod(parent) ||
          t.isClassMethod(parent) ||
          t.isFunctionDeclaration(parent) ||
          t.isFunctionExpression(parent)
        )) return;
        path.replaceWith(t.identifier(GLOBAL_THIS_REPLACEMENT));
      }
    }
  };
}