function iterate(obj, options) {
  let result = [];
  try {
    if (obj[Symbol.iterator]) {
      result.push(...Array.from(obj))
    }

    if (options.usePrototype && obj.__proto__) {
      result.push(obj.__proto__)
    }

    const props = Object.getOwnPropertyNames(obj);
    result.push(...props.map(prop => obj[prop]));
  } catch(e) {
    // ignore errors
  }

  return result;
}

function _convexHull(root, options, all = new Set()) {

  if (root !== undefined && root !== null && all.size < options.sizeLimit && !all.has(root)) {

    all.add(root);

    iterate(root, options).forEach(ea => {
      _convexHull(ea, options, all);
    });

  }
  
  return all;
}

export function convexHull(root, options = {}) {
  return _convexHull(root, Object.assign({
    usePrototype: false,
    sizeLimit: Infinity
  }, options));
}

if(self.lively) {
  lively.reflection = { convexHull };
}
