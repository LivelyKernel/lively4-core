
export function extend(obj, definitions) {
  for (let [propName, value] of Object.entries(definitions)) {
    Object.defineProperty(obj, propName, {
      configurable: true,
      enumerable: false,
      value,
      writable: true
    });
  }
}

