import { toDOMNode } from "./ui-aexpr.js";
import { BaseActiveExpression as ActiveExpression } from 'active-expression';

/**
 * Resources for JSX Semantics
 * Web components in react: https://facebook.github.io/react/docs/web-components.html
 * Child lists and keys: https://facebook.github.io/react/docs/lists-and-keys.html
 * JSX babel transform helpers: https://github.com/babel/babel/blob/7.0/packages/babel-helper-builder-react-jsx/src/index.js
 */

function addMetaData(element, data = {}) {
  return element.jsxMetaData = Object.assign(element.jsxMetaData || {}, data);
}

function basicCreateElement(tagName) {
  const element = document.createElement(tagName);
  
  addMetaData(element, { timeOffset: performance.now() });
  
  return element;
}

// cannot use JSX elements in implementation of JSX elements :(
function getPendingNode() {
  const icon = basicCreateElement("i");
  icon.classList.add("fa", "fa-spinner", "fa-pulse", "fa-fw")
  const span = document.createElement("span");
  span.style.color = "yellow";
  span.appendChild(icon);
  span.appendChild(document.createTextNode("pending"));
  return span;
}

function getErrorNode(e) {
  const icon = basicCreateElement("i");
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
    return toDOMNode.call(expression, value => {
      const node = getExpressionNode(value);
      // TODO: jsx-ray does not work on TextNodes, yet
      addMetaData(element, { aexpr: expression });
      return node;
    });
  }
  return ensureDOMNode(expression);
}

function ensureDOMNode(nodeOrObject) {
  if (nodeOrObject instanceof Node) {
    return nodeOrObject;
  }
  
  // Symbols needexplicitly need to be converted to strings
  if (typeof nodeOrObject === 'symbol') {
    return document.createTextNode(nodeOrObject.toString());
  }
  
  return document.createTextNode(nodeOrObject);
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
      const referenceNode = <unused style="position: absotule"></unused>;
      roqsByReferenceNode.set(referenceNode, nodeOrActiveGroup);
      return referenceNode; // use to insert elements of the ActiveGroup in the corresponding place
    } else {
      return nodeOrActiveGroup;
    }
  }
  function initActiveGroup(referenceNode) {
    if(roqsByReferenceNode.has(referenceNode)) {
      const activeGroup = roqsByReferenceNode.get(referenceNode);
      
      activeGroup
        .map(item => {
          const node = getExpressionNode(item)
          addMetaData(node, { item, activeGroup });
          return node;
        })
        .enter(node => {
          referenceNode.parentNode.insertBefore(node, referenceNode)
        })
        .exit(node => node.remove());
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

function addSourceLocation(element, sourceLocation) {
  if (sourceLocation) {
    addMetaData(element, { sourceLocation });
  }
}

export function element(tagName, attributes, children, sourceLocation) {
  const isWebComponent = tagName.includes('-');
  const handleAsync = isWebComponent || children.some(child => child &&
                                                      child instanceof Promise &&
                                                      child[isPromiseForJSXElement]);
  if(handleAsync) {
    let resolvedTag;
    const returnPromise = Promise.resolve(isWebComponent ?
                               lively.components.loadAndOpenComponent(tagName) :
                               basicCreateElement(tagName))
      .then(element => {
        resolvedTag = element;
        addSourceLocation(resolvedTag, sourceLocation);
        return Promise.all(children.map(c => Promise.resolve(c)));
      })
      .then(resolvedChildren => composeElement(resolvedTag, attributes, resolvedChildren));
    returnPromise[isPromiseForJSXElement] = true;
    return returnPromise;
  } else {
    const tag = basicCreateElement(tagName);
    addSourceLocation(tag, sourceLocation);
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
  // #TODO: <ul>{active-group}</ul> also gets the reactive behavior, do we want this?
  if(isActiveGroup(array)) {
    return [array];
  } else {
    return array;
  }
}

