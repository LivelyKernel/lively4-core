
import { uuid } from 'utils';

export class PIScheme {
  static get isPIScheme() { return true; }

  static createRef(options, strings, expressions) {
    const reference = new this();
    reference.configure(options, strings, expressions);
    reference.initialize();
    return reference;
  }
  
  configure(options = {}, strings, expressions) {
    Object.assign(this, options);
    this.strings = strings;
    this.expressions = expressions;
  }

  // hook into a created reference
  initialize() {}

  get access() {
    return this.read();
  }
  set access(value) {
    return this.write(value);
  }
}

export function makeRef(Scheme, options) {
  if (Scheme && Scheme.isPIScheme) {
    return (strings, ...expressions) => Scheme.createRef(options, strings, expressions);
  }

  return (...args) => ({
    access: Scheme(...args)
  });
}


/*MD # Basic Schemes MD*/

export class local extends PIScheme {
  initialize() {
    this.local = this.strings.first;
  }
  read() {
    return this.evalFunction(this.local);
  }
  write(value) {
    const id = uuid();
    self[id] = value;
    try {
      return this.evalFunction(this.local + ` = self['${id}']`);
    } finally {
      delete self[id];
    }
  }
}

function saveJSON(key, json) {
  const stringValue = JSON.stringify(json, undefined, 2);
  return this.setItem(key, stringValue);
}
function loadJSON(key) {
  const stringValue = this.getItem(key);
  if (!stringValue) {
    return undefined;
  }
  return JSON.parse(stringValue);
}

class ls extends PIScheme {
  initialize() {
    this.local = this.strings.first;
  }
  read() {
    return this.evalFunction(this.local);
  }
  write(value) {
    const id = uuid();
    self[id] = value;
    try {
      return this.evalFunction(this.local + ` = self['${id}']`);
    } finally {
      delete self[id];
    }
  }
}
export {ls as localStorage};

export class query extends PIScheme {
  read() {
    const { element, type, prop } = this.parse();

    if (type === 'prop') {
      return element[prop];
    }

    if (type === 'attr') {
      return element.getAttribute(prop);
    }

    if (type === 'style') {
      return element.style[prop];
    }

    if (type === 'html') {
      return element.innerHTML;
    }

    return element;
  }
  write(v) {
    const { element, type, prop } = this.parse();

    if (!type) {
      element.replaceWith(v);
      return v;
    }
    if (type === 'prop') {
      return element[prop] = v;
    }
    if (type === 'attr') {
      element.setAttribute(prop, v);
      return v;
    }
    if (type === 'style') {
      return element.style[prop] = v;
    }
    if (type === 'html') {
      return element.innerHTML = v;
    }

    element.forEach(e => e.innerHTML = v)
  }

  // helper
  parse() {
    const [selector, type, prop] = this.strings.first.split('/');
    const element = this.query(selector);
    return { selector, type, prop, element };
  }
  query(selector) {
    return document.querySelector(selector);
  }
}

export class queryAll extends PIScheme {}
