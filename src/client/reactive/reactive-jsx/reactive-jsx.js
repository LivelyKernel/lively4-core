import { toDOMNode } from "./ui-aexpr.js";
import { BaseActiveExpression as ActiveExpression } from 'active-expression';
import _ from 'src/external/lodash/lodash.js';

/**
 * Resources for JSX Semantics
 * Web components in react: https://facebook.github.io/react/docs/web-components.html
 * Child lists and keys: https://facebook.github.io/react/docs/lists-and-keys.html
 * JSX babel transform helpers: https://github.com/babel/babel/blob/7.0/packages/babel-helper-builder-react-jsx/src/index.js
 */

function addMetaData(element, data = {}) {
  return element.elementMetaData = Object.assign(element.elementMetaData || {}, data);
}

const svgTags = [
//  'a',
  'animate',
  'animateMotion',
  'animateTransform',
  'circle',
  'clipPath',
  'defs',
  'desc',
  'ellipse',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  'filter',
  'foreignObject',
  'g',
  'hatch',
  'hatchpath',
  'image',
  'line',
  'linearGradient',
  'marker',
  'mask',
  'metadata',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'script',
  'set',
  'stop',
  'style',
  'svg',
  'switch',
  'symbol',
  'text',
  'textPath',
  'title',
  'tspan',
  'use',
  'view',
];

function basicCreateElement(tagName) {
  const xmlns = "http://www.w3.org/2000/svg";
  const element = svgTags.includes(tagName) ? document.createElementNS(xmlns, tagName) : document.createElement(tagName);
  
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

  // handle objects created with `Object.create(null)`
  if (!(nodeOrObject instanceof Object) && typeof nodeOrObject === 'object') {
    return document.createTextNode(Object.assign({}, nodeOrObject));
  }

  return document.createTextNode(nodeOrObject);
}

function isActiveGroup(obj) {
  return obj && obj.isActiveGroup;
}

function composeElement(tagElement, attributes, children) {
  for (let [key, value] of Object.entries(attributes)) {
    if (!value) continue;
    if (key.startsWith('v-')) {
      _.assign(
        tagElement.props || (tagElement.props = {}),
        { [key.substring(2)]: value }
      );
    } else if(value instanceof Function) {
      // functions provided as attributes are used to create event listeners
      // tagElement.addEventListener(key, value);
      tagElement[`on${key}`] = value;
    } else {
      tagElement.setAttribute(key, value.toString());
    }
  }
  
  const roqsByReferenceNode = new WeakMap();
  function handleActiveGroup(nodeOrActiveGroup) {
    if(isActiveGroup(nodeOrActiveGroup)) {
      const referenceNode = document.createElement('unused');
      referenceNode.style.position = "absolute";
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

export function addSourceLocation(element, sourceLocation) {
  if (element) {
    if (element instanceof Promise) {
      element.then(e => addSourceLocation(e, sourceLocation));
    } else {
      if (sourceLocation) {
        addMetaData(element, { sourceLocation });
      }
    }
  }
  return element;
}

function addJSXSourceLocation(element, sourceLocation) {
  addSourceLocation(element, sourceLocation);
  addMetaData(element, { jsx: true });
}

export function element(tagName, attributes, children, sourceLocation) {
  const isWebComponent = tagName.includes('-');
  const handleAsync = isWebComponent || children.some(child => child &&
                                                      child instanceof Promise &&
                                                      child[isPromiseForJSXElement]);
  if(handleAsync) {
    let resolvedTag;
    const returnPromise = Promise.resolve(isWebComponent ?
                               lively.create(tagName) :
                               basicCreateElement(tagName))
      .then(element => {
        resolvedTag = element;
        addJSXSourceLocation(resolvedTag, sourceLocation);
        return Promise.all(children.map(c => Promise.resolve(c)));
      })
      .then(resolvedChildren => composeElement(resolvedTag, attributes, resolvedChildren));
    returnPromise[isPromiseForJSXElement] = true;
    return returnPromise;
  } else {
    const tag = basicCreateElement(tagName);
    addJSXSourceLocation(tag, sourceLocation);
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

