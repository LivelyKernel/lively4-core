import _ from 'src/external/lodash/lodash.js'

/* Generic */

const isExtending = (classDeclarationPath, superClassIdentifierName) =>
  classDeclarationPath.node.superClass &&
  classDeclarationPath.node.superClass.name === superClassIdentifierName;

const getClassMethodByName = (path, name) =>
  _(path.get('body').get('body'))
    .filter(possibleClassMethod => possibleClassMethod.isClassMethod())
    .find(classMethod => classMethod.get('key').isIdentifier({ name }));

/* Bind Input Fields */

const addBindInputFieldsMethodCall = (t, path) => {
  const connectedCallback = getClassMethodByName(path, 'connectedCallback');
  const superCall = getSuperAttachedCallback(connectedCallback);
  const bindMethodCall = createBindMethodCall(t);
  if (superCall)
    superCall.replaceWith(bindMethodCall);
  else
    connectedCallback.get('body').unshiftContainer('body', bindMethodCall);
}

const createBindMethodCall = t =>
  t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.callExpression(
          t.memberExpression(
            t.super(),
            t.identifier('connectedCallback')
          ),
          []
        ),
        t.identifier('then')
      ),
      [
        t.arrowFunctionExpression(
          [],
          t.blockStatement(
            [
              t.ifStatement(
                t.callExpression(
                  t.memberExpression(
                    t.thisExpression(),
                    t.identifier('isDummy')
                  ),
                  []
                ),
                t.returnStatement()
              ),
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.thisExpression(),
                    t.identifier('bindInputFields')
                  ),
                  []
                )
              )
            ]
          )
        ) 
      ]
    )
  );

const getSuperAttachedCallback = path => {
  let found = undefined;
  path.traverse({
    Super(path) {
      const parent = path.parentPath;
      found = found || 
        parent.isMemberExpression() && 
        parent.parentPath.isCallExpression() &&
        parent.get('property').node.name === 'connectedCallback' 
      && parent.parentPath;
    }
  });
  return found;
}

const bindInputFields = (t, path) => {
  const inputFields = findInputFieldsInRenderReturn(t, path);
  const bindingMethod = createBindingMethod(t, inputFields);
  path.get('body').pushContainer('body', bindingMethod);
};

const findInputFieldsInRenderReturn = (t, path) => {
  const inputFields = [];
  const renderMethod = getClassMethodByName(path, 'render');
  if (renderMethod) {
    const returnStatement = _(renderMethod.get('body').get('body')).find(element =>
                                                                         element.isReturnStatement());
    if (returnStatement)
      returnStatement.traverse(inputFieldFetchVisitor(), { inputFields });
  }
  return inputFields;
};

const inputFieldFetchVisitor = () => ({
  JSXElement(path) {
    const openingElement = path.get('openingElement');    
    if (!openingElement || 
        !openingElement.get('name').isJSXIdentifier({ name: 'input' }) &&
        !openingElement.get('name').isJSXIdentifier({ name: 'textarea' }))
      return;
    const idAttribute = _(openingElement.get('attributes'))
      .find(jsxAttribute => jsxAttribute.get('name').isJSXIdentifier({ name: 'id' }));
    const valueAttribute = _(openingElement.get('attributes'))
      .find(jsxAttribute => jsxAttribute.get('name').isJSXIdentifier({ name: 'value' }));
    const formOpeningElement = findFormParent(path).get('openingElement');
    const formIdAttribute = _(formOpeningElement.get('attributes'))
      .find(jsxAttribute => jsxAttribute.get('name').isJSXIdentifier({ name: 'id' }));
    if (!idAttribute || !formIdAttribute || !(valueAttribute && valueAttribute.get('value').isJSXExpressionContainer())) return;
    const valueExpression = valueAttribute.get('value').get('expression').node;
    this.inputFields.push({ 
      id: idAttribute.get('value').node, 
      valueExpression, 
      formId: formIdAttribute.get('value').node,
    });
  }
});

const findFormParent = path =>
  path.findParent((path) => 
    path.isJSXElement() &&
    path.get('openingElement') &&
    path.get('openingElement').get('name').isJSXIdentifier({ name: 'form' }));

const createBindingMethod = (t, inputFields) =>
  t.classMethod(
    'method',
    t.identifier('bindInputFields'),
    [],
    t.blockStatement(
      _(inputFields).map(({ id, valueExpression, formId, type }) =>
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              t.thisExpression(),
              t.identifier('addAExpr')
            ),
            [t.callExpression(
              t.memberExpression(
                t.callExpression(
                  t.Identifier('aexpr'),
                  [t.arrowFunctionExpression(
                    [],
                    t.memberExpression(
                      t.callExpression(
                        t.memberExpression(
                          t.thisExpression(),
                          t.identifier('get')
                        ),
                        [t.templateLiteral(
                          [
                            t.templateElement({ raw: '#', cooked: '#' }),
                            t.templateElement({ raw: ' #', cooked: ' #' }),
                            t.templateElement({ raw: '', cooked: '' })
                          ],[
                            formId,
                            id
                          ]
                        )]
                      ),
                      t.identifier('value')
                    )
                  )]
                ),
                t.identifier('onChange')
              ),
              [t.arrowFunctionExpression(
                [t.identifier('value')],
                t.assignmentExpression(
                  '=',
                  valueExpression,
                  t.identifier('value')
                )
              )]
            ),
            t.stringLiteral('inputFields')]
          )
        )
      ).value()
    )
  );

/* Ensure attached callback existance */
const createAttachedCallback = t =>
  t.classMethod(
    'method',
    t.identifier('connectedCallback'),
    [],
    t.blockStatement([
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.super(),
            t.identifier('connectedCallback')
          ),
          []
        )
      )
    ]),
  );

const ensureAttachedCallbackExistance = (t, path) => {
  if (!getClassMethodByName(path, 'connectedCallback')) {
    path.get('body').unshiftContainer('body', createAttachedCallback(t));
  }
}

/* Console log for tracing all render calls */
const addRenderConsoleLog = (t, path) => {
  const renderMethod = getClassMethodByName(path, 'render');
  if (!renderMethod) return;
  renderMethod.get('body').unshiftContainer('body', logRenderToConsole(t));
}

const logRenderToConsole = t => 
  t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier('console'),
        t.identifier('log')
      ),
      [t.templateLiteral(
        [
          t.templateElement({ raw: 'render ', cooked: 'render ' }),
          t.templateElement({ raw: '', cooked: '' })
        ],[
          t.memberExpression(
            t.thisExpression(),
            t.identifier('localName')
          )
        ]
      )]
    )
  );

/* Console log for tracing all detached calls */
const addDetachedConsoleLog = (t, path) => {
  const disconnectedCallbackMethod = getClassMethodByName(path, 'disconnectedCallback');
  if (!disconnectedCallbackMethod) return;
  disconnectedCallbackMethod.get('body').unshiftContainer('body', logDetachedToConsole(t));
}

const logDetachedToConsole = t => 
  t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier('console'),
        t.identifier('log')
      ),
      [t.templateLiteral(
        [
          t.templateElement({ raw: 'detached ', cooked: 'detached ' }),
          t.templateElement({ raw: '', cooked: '' })
        ],[
          t.memberExpression(
            t.thisExpression(),
            t.identifier('localName')
          )
        ]
      )]
    )
  );

/* Reactive Morph */

export const reactiveMorphVisitor = t => ({
  ClassDeclaration(path) {
    if (!isExtending(path, 'ReactiveMorph')) return;
    ensureAttachedCallbackExistance(t, path);
    bindInputFields(t, path);
    addBindInputFieldsMethodCall(t, path);
    // addRenderConsoleLog(t, path);
    // addDetachedConsoleLog(t, path);
  },
});