
export class PIScheme {
  static get isPIScheme() { return true; }

  static createRef(options, strings, ...expressions) {
    const reference = new this();
    reference.configure(options, strings, ...expressions);
    reference.initialize();
    return reference;
  }
  
  configure(options = {}, strings, ...expressions) {
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
    return (strings, ...expressions) => Scheme.createRef(options, strings, ...expressions);
  }

  return (...args) => ({
    access: Scheme(...args)
  });
}
