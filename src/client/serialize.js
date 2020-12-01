import { uuid } from 'utils';

export function serialize(obj) {
  const references = new Map();

  function replacer(key, value) {
    if (key === '$array') {
      return value;
    }
    
    if (value instanceof Object && !(value instanceof Function)) {
      if (!references.has(value)) {
        // 1st occurence: remember you saw that one
        const id = uuid();
        references.set(value, id);

        if (Array.isArray(value)) {
          return { $id: id, $array: [...value] };
        } else {
          const result = Object.assign({ $id: id }, value);

          const classToRemember = value.__proto__.constructor;
          if (classToRemember !== Object) {
            result.$class = classToRemember.name;
          }

          return result;
        }
      } else {
        const reference = { $ref: references.get(value) };

        if (Array.isArray(value)) {
          reference.$isArray = true;
        }

        return reference;
      }
    }

    return value;
  }

  return JSON.stringify(obj, replacer, 2);
}

export function deserialize(json, classes = {}) {
  const idToObj = new Map();

  function reviver(key, value) {
    if (!value) {
      return value;
    }

    if (value.$ref) {
      return idToObj.getOrCreate(value.$ref, () => value.$isArray ? [] : {});
    }

    if (value.$id) {
      const id = value.$id;
      delete value.$id;
      
      const array = value.$array;

      if (idToObj.has(id)) {
        const proxy = idToObj.get(id);

        if (array) {
          proxy.push(...array);
          value = proxy;
        } else {
          value = Object.assign(proxy, value);
        }
      } else {
        if (array) {
          value = array;
        }
        idToObj.set(id, value);
      }
    }

    if (value.$class) {
      const className = value.$class;
      delete value.$class;

      const classToRestore = classes[className];
      if (classToRestore) {
        value.migrateTo(classToRestore);
      }
    }

    return value;
  }

  return JSON.parse(json, reviver);
}