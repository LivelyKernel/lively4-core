import { uuid } from 'utils';

export function serialize(obj) {
  const references = new Map();

  function replacer(key, value) {
    if (value instanceof Object && !(value instanceof Function)) {
      if (!references.has(value)) {
        // 1st occurence: remember you saw that one
        const id = uuid();
        references.set(value, id);
        value.$id = id;
      } else {
        return { $ref: references.get(value) };
      }
    }

    return value;
  }

  return JSON.stringify(obj, replacer, 2);
}

export function deserialize(json, classes = {}) {
  const idToObj = new Map();

  function reviver(key, value) {
    if (value && value.$ref) {
      return idToObj.getOrCreate(value.$ref, () => ({}));
    }

    if (value && value.$id) {
      const id = value.$id;
      delete value.$id;

      if (idToObj.has(id)) {
        const proxy = idToObj.get(id);
        
        return Object.assign(proxy, value);
      } else {
        idToObj.set(id, value);
        return value;
      }
    }

    return value;
  }

  return JSON.parse(json, reviver);
}