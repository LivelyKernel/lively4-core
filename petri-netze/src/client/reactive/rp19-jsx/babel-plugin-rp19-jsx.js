import jsx from "babel-plugin-syntax-jsx";
import Preferences from 'src/client/preferences.js';
import { reactiveMorphVisitor } from 'src/client/reactive/rp19-jsx/rp19-jsx.js';

/**
 * Resources for JSX Syntax
 * JSX babel Preset: https://github.com/babel/babel/blob/master/packages/babel-preset-react/src/index.js
 * JSX spec draft: https://github.com/facebook/jsx
 * JSX Syntax definition in babel: https://github.com/babel/babel/blob/master/packages/babel-types/src/definitions/jsx.js#L10
 * Babel nodes list: https://babeljs.io/docs/core-packages/babel-types/#api-jsxidentifier
 */

const hasDirective = (path, name) => 
  !!path.get('directives')
    .find(directive =>
      directive.get('value').get('value').node === name);

const shouldTransform = (path, state) => {
  const rp19Directive = hasDirective(path, 'enable rp19-jsx');
  const rp19Preference = Preferences.get('UseRP19JSX');
  const inFile = state.opts.executedIn === 'file';

  if (inFile) {
    return rp19Directive;
  } else {
    return rp19Preference;
  }
}

const createAExprDirective = t =>
  t.directive(
    t.directiveLiteral(
      'enable aexpr'
    )
  );

const ensureAExprDirectiveExistance = (path, t) => {
  if (!hasDirective(path, 'enable aexpr'))
    path.pushContainer('directives', createAExprDirective(t));
}

export default ({ types: t }) => ({
  inherits: jsx,
  visitor: {
    Program(path, state) {
      if (!shouldTransform(path, state)) { return; }
      ensureAExprDirectiveExistance(path, t);
      path.traverse(reactiveMorphVisitor(t));
    }
  }
});
