import { toDOMNode } from "./aexpr/ui-aexpr.js";
import { BaseActiveExpression as ActiveExpression } from "active-expressions";

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
  if(expression instanceof ActiveExpression) {
    return toDOMNode.call(expression, getExpressionNode);
  }
  return ensureDOMNode(expression);
}

function ensureDOMNode(nodeOrObject) {
  return nodeOrObject instanceof Node ?
      nodeOrObject :
      document.createTextNode(nodeOrObject);
}

function isActiveGroup(obj) {
  return obj && obj.isActiveGroup;
}

function composeElement(tagElement, attributes, children) {
  
  for (let [key, value] of Object.entries(attributes)) {
    if(value instanceof Function) {
      // functions provided as attributes are used to create event listeners
      tagElement.addEventListener(key, value);
    } else {
      tagElement.setAttribute(key, value.toString());
    }
  }
  
  const roqsByReferenceNode = new WeakMap();
  function handleActiveGroup(nodeOrActiveGroup) {
    if(isActiveGroup(nodeOrActiveGroup)) {
      const referenceNode = <unused></unused>;
      roqsByReferenceNode.set(referenceNode, nodeOrActiveGroup);
      return referenceNode; // use to insert elements of the ActiveGroup in the corresponding place
    } else {
      return nodeOrActiveGroup;
    }
  }
  function initActiveGroup(referenceNode) {
    if(roqsByReferenceNode.has(referenceNode)) {
      const activeGroup = roqsByReferenceNode.get(referenceNode);
      
      activeGroup.map(getExpressionNode)
        .enter(item => referenceNode.parentNode.insertBefore(item, referenceNode))
        .exit(item => item.remove());
    }
  }

  children
    .map(handleActiveGroup)
    .map(ensureDOMNode)
    .forEach(child => {
      tagElement.appendChild(child);
      initActiveGroup(child);
    });
  
  return tagElement;
}

export const isPromiseForJSXElement = Symbol('isPromiseForJSXElement');

export function element(tagName, attributes, children) {
  const isWebComponent = tagName.includes('-');
  const handleAsync = isWebComponent || children.some(child => child &&
                                                      child instanceof Promise &&
                                                     child[isPromiseForJSXElement]);
  if(handleAsync) {
    let resolvedTag;
    const returnPromise = Promise.resolve(isWebComponent ?
                               lively.create(tagName) :
                               document.createElement(tagName))
      .then(element => {
        resolvedTag = element;
        return Promise.all(children.map(c => Promise.resolve(c)));
      })
      .then(resolvedChildren => composeElement(resolvedTag, attributes, resolvedChildren));
    returnPromise[isPromiseForJSXElement] = true;
    return returnPromise;
  } else {
    const tag = document.createElement(tagName);
    return composeElement(tag, attributes, children);
  }
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
  return { [key]: value };
}

export function attributeSpread(obj) {
  return obj;
}

export function children(...children) {
  return [].concat(...children);
}

export function childText(text) {
  return [ensureDOMNode(text)];
}

export function childElement(jSXElement) {
  return [jSXElement];
}

// can take:
// - a DOM node
// - a JavaScript object or primitive
// - a Promise
// - an Active Expression
export function childExpression(expression) {
  return [getExpressionNode(expression)];
}

export function childSpread(array) {
  // #TODO: <ul>{roq}</ul> also gets the reactive behavior, do we want this?
  if(isActiveGroup(array)) {
    return [array];
  } else {
    return array;
  }
}

