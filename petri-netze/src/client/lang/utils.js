
export function extend(obj, definitions) {
  const descriptors = Object.getOwnPropertyDescriptors(definitions);
  for (let [propName, descriptor] of Object.entries(descriptors)) {
    descriptor.enumerable = false;
    Object.defineProperty(obj, propName, descriptor);
  }
}

