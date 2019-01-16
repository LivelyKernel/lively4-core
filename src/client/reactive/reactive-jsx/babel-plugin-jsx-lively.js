import jsx from "babel-plugin-syntax-jsx";

function detectUnsupportedNodes(path, filename) {
  function gainPrintableFullPath(path) {
    let fullPath = [];
    
    while(path) {
      fullPath.unshift(path.node.type);
      path = path.parentPath;
    }
    
    return fullPath.map((nodeType, index) => '  '.repeat(index) + nodeType).join('\n');
  }
  
  path.traverse({
    /**
     * No support for JSXMemberExpression yet. #TODO: what are the semantics outside of react for this?
     * 
     * <foo.bar></foo.bar>
     */
    JSXMemberExpression(path, state) {
      throw new SyntaxError(`JSXMemberExpression not yet supported.
${gainPrintableFullPath(path)}`, filename, path.node.loc.start.line);
    },
    /**
     * No support for JSXEmptyExpression yet. #TODO: where is this feature even useful?
     * 
     * <div id={}></div>
     * or
     * <div>{}</div>
     */
    JSXEmptyExpression(path, state) {
      throw new SyntaxError(`JSXEmptyExpression not yet supported.
${gainPrintableFullPath(path)}`, filename);
    },
    /**
     * No support for jSXNamespacedName yet.
     * 
     * <div ns:attr="val" />;
     */
    JSXNamespacedName(path, state) {
      throw new SyntaxError(`jSXNamespacedName not yet supported.
${gainPrintableFullPath(path)}`, filename, path.node.loc.start.line);
    }
  });
}

/**
 * Resources for JSX Syntax
 * JSX babel Preset: https://github.com/babel/babel/blob/master/packages/babel-preset-react/src/index.js
 * JSX spec draft: https://github.com/facebook/jsx
 * JSX Syntax definition in babel: https://github.com/babel/babel/blob/master/packages/babel-types/src/definitions/jsx.js#L10
 * Babel nodes list: https://babeljs.io/docs/core-packages/babel-types/#apij-sxidentifier
 */
export default function ({ types: t, template, traverse }) {
  const GENERATED_IMPORT_IDENTIFIER = Symbol("generated import identifier");

  // #TODO: duplicate with aexpr transform -> extract it
  function addCustomTemplate(file, name) {
    let declar = file.declarations[name];
    if (declar) return declar;

    let identifier = file.declarations[name] = file.addImport("reactive-jsx", name, name);
    identifier[GENERATED_IMPORT_IDENTIFIER] = true;
    return identifier;
  }
  
  return {
    inherits: jsx,
    visitor: {
      Program(path, state) {
        detectUnsupportedNodes(path, state && state.opts && state.opts.filename);
        
        function transformPath(path, programState) {
          function jSXAttributeToBuilder(path) {

            function getCallExpressionFor(functionName, ...additionalParameters) {
              return t.callExpression(
                addCustomTemplate(programState.file, functionName), // builder function
                [
                  t.stringLiteral(path.get("name").node.name), // key
                  ...additionalParameters
                ]
              );
            }
            
            let attributeValue = path.get("value");
            if(path.isJSXSpreadAttribute()) {
              return t.callExpression(
                addCustomTemplate(programState.file, "attributeSpread"),
                [ path.get("argument").node ]
              );
            } else if(!path.node.value) {
              return getCallExpressionFor("attributeEmpty");
            } else if(attributeValue.isStringLiteral()) {
              return getCallExpressionFor("attributeStringLiteral", attributeValue.node);
            } else if(attributeValue.isJSXExpressionContainer()) {
              return getCallExpressionFor("attributeExpression", attributeValue.node.expression);
            } else if(attributeValue.isJSXElement()) {
              // #TODO: what would that even mean?
              throw new SyntaxError(`JSXElement as property value of JSXAttribute not yet supported.`);
            }

            throw new Error('unknown node type in JSXAttribute value ' + attributeValue.node.type);
          }
          
          function jSXChildrenToBuilder(child) {
            function getCallExpressionFor(functionName, childSpec) {
              return t.callExpression(
                addCustomTemplate(programState.file, functionName), // builder function
                [
                  childSpec
                ]
              );
            }

            if(child.isJSXText()) {
              return getCallExpressionFor("childText", t.stringLiteral(child.node.value));
            }
            if(child.isJSXElement()) {
              return getCallExpressionFor("childElement", child.node);
            }
            if(child.isJSXExpressionContainer()) {
              return getCallExpressionFor("childExpression", child.get("expression").node);
            }
            if(child.isJSXSpreadChild()) {
              return getCallExpressionFor("childSpread", child.get("expression").node);
              //throw new SyntaxError(`JSXSpreadChild as child of JSXElement not yet supported.`);
            }
            throw new Error('unknown node type in children of JSXElement ' + child.node.type);
          }
          
          
          path.traverse({
            JSXElement(path, state) {
              const jSXAttributes = path.get("openingElement").get("attributes");
              const jSXChildren = path.get("children");

              let newNode = t.callExpression(
                addCustomTemplate(programState.file, "element"),
                [
                  t.stringLiteral(path.get("openingElement").get("name").node.name),
                  t.callExpression(
                    addCustomTemplate(programState.file, "attributes"),
                    jSXAttributes.map(jSXAttributeToBuilder)
                  ),
                  t.callExpression(
                    addCustomTemplate(programState.file, "children"),
                    jSXChildren.map(jSXChildrenToBuilder)
                  ),
                ]
              );

              path.replaceWith(newNode);
            }
          })
          
          return path;
        }

        transformPath(path, state);
      }
    }
  };
}
