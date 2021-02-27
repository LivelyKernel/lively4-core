
const SHARED_FLAG_GENERATED_IMPORT_IDENTIFIER = 'SHARED_FLAG_GENERATED_IMPORT_IDENTIFIER';

export default function ({ types: t, template }) {
  return {
    name: 'polymorphic-identifiers',
    visitor: {
      Program: {
        enter(path, state) {
          function addCustomTemplate(file, name) {
            const declar = file.declarations[name];
            if (declar) {
              return declar;
            }

            const identifier = file.declarations[name] = file.addImport("polymorphic-identifiers", name, name);
            identifier[SHARED_FLAG_GENERATED_IMPORT_IDENTIFIER] = true;
            return identifier;
          }

          function hasDirective(path, name) {
            let foundDirective = false;
            path.traverse({
              Directive(path) {
                if (path.get("value").node.value === name) {
                  foundDirective = true;
                }
              }
            });
            return foundDirective;
          }

          const shouldTransform = state.opts.executedIn === 'workspace' || hasDirective(path, "pi");
          if (!shouldTransform) {
            return;
          }

          path.traverse({
            TaggedTemplateExpression(path) {
              if (path.node.visitedByPI) {
                return;
              }
              path.node.visitedByPI = true;

              const tagTemplate = template(`MAKE_REF(TAG_NODE, {
                thisReference: this,
                evalFunction: str => eval(str)
              })`);
              const tagPath = path.get('tag');
              tagPath.replaceWith(tagTemplate({
                MAKE_REF: addCustomTemplate(state.file, 'makeRef'),
                TAG_NODE: tagPath.node
              }));

              path.replaceWith(t.memberExpression(path.node, t.identifier('access')));

              const parentPath = path.parentPath;
              if (parentPath.isBinaryExpression() && path.parentKey === 'left' && parentPath.node.operator === "<<") {
                parentPath.replaceWith(parentPath.node.right);

                // find something we can embed an assignment expression in
                const preStatementAncestor = parentPath.find(p => {
                  const parent = p.parentPath;
                  return parent && (parent.isStatement() || parent.isArrowFunctionExpression() && p.parentKey === "body");
                });
                const assignment = t.assignmentExpression('=', path.node, preStatementAncestor.node);
                assignment.loc = preStatementAncestor.node.loc;
                preStatementAncestor.replaceWith(assignment);
              }
            }
          });
        }
      }
    }
  };
}