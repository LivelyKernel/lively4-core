
export function extend(obj, definitions) {
  const descriptors = Object.getOwnPropertyDescriptors(definitions);
  for (let [propName, descriptor] of Object.entries(descriptors)) {
    const existingDescriptor = Object.getOwnPropertyDescriptor(obj, propName)
    if (existingDescriptor) {
      console.warn(`Overwriting existing property '${propName}'`, existingDescriptor, `of`, obj, `with new descriptor`, descriptor, `. Consider removing this behavior adaptation.`)
    }

    descriptor.enumerable = false;
    Object.defineProperty(obj, propName, descriptor);
  }
}

