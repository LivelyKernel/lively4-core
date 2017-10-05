import {} from "./aexpr/ui-aexpr.js";

/**
 * Resources for JSX Semantics
 * Web components in react: https://facebook.github.io/react/docs/web-components.html
 * Child lists and keys: https://facebook.github.io/react/docs/lists-and-keys.html
 * JSX babel transform helpers: https://github.com/babel/babel/blob/7.0/packages/babel-helper-builder-react-jsx/src/index.js
 */

// cannot use JSX elements in implementation of JSX elements :(
function getPendingNode() {
  const icon = document.createElement("i");
  icon.classList.add("fa", "fa-spinner", "fa-pulse", "fa-fw")
  const span = document.createElement("span");
  span.style.color = "yellow";
  span.appendChild(icon);
  span.appendChild(document.createTextNode("pending"));
  return span;
}

function getErrorNode(e) {
  const icon = document.createElement("i");
  icon.classList.add("fa", "fa-exclamation-triangle")
  const span = document.createElement("span");
  span.style.color = "red";
  span.appendChild(icon);
  span.appendChild(document.createTextNode(e));
  return span;
}

function getExpressionNode(expression) {
  if(expression instanceof Promise) {
    let promNode = getPendingNode();
    expression
      .then(val => promNode.replaceWith(getExpressionNode(val)))
      .catch(e => promNode.replaceWith(getErrorNode(e)));
    return promNode;
  }
  return toDOMNode(expression);
}

function toDOMNode(nodeOrObject) {
  return nodeOrObject instanceof Node ?
      nodeOrObject :
      document.createTextNode(nodeOrObject);
}

export function element(tagName, attributes, children) {
  const tag = document.createElement(tagName);
  
  for (let [key, value] of Object.entries(attributes)) {
    tag.setAttribute(key, value);
  }
  
  children
    .map(toDOMNode)
    .forEach(child => tag.appendChild(child));
  
  return tag;
}

export function attributes(...attrs) {
  return Object.assign({}, ...attrs);
}

export function attributeStringLiteral(key, value) {
  return { [key]: value };
}

export function attributeEmpty(key) {
  return { [key]: key };
}

export function attributeExpression(key, value) {
  return { [key]: value.toString() };
}

export function attributeSpread(obj) {
  return obj;
}

export function children(...children) {
  return [].concat(...children);
}

export function childText(text) {
  return [toDOMNode(text)];
}

export function childElement(jSXElement) {
  return [jSXElement];
}

// can take:
// - a DOM node
// - a JavaScript object or primitive
// - a Promise
export function childExpression(expression) {
  return [getExpressionNode(expression)];
}

export function childSpread(array) {
  return array;
}

