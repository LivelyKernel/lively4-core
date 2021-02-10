
export class PIScheme {
  static get isPIScheme() { return true; }

  applyOptions(options = {}) {
    Object.assign(this, options);
  }

  create(strings, ...expressions) {
    this.strings = strings;
    this.expressions = expressions;
  }

  get access() {
    return this.read();
  }
  set access(value) {
    return this.write(value);
  }
}

export function makeRef(referenceClass, options) {
  if (referenceClass && referenceClass.isPIScheme) {
    const reference = new referenceClass(options);
    reference.applyOptions(options);

    return (strings, ...expressions) => {
      reference.create(strings, ...expressions);
      return reference
    };
  }

  return (...args) => ({
    access: referenceClass(...args)
  });
}
