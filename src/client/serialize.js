import { uuid } from 'utils';

/**
 * @param outerReplacer: gets called BEFORE serialization, with same key, value, and this reference as the original replacer would
 */
export function serialize(obj, outerReplacer) {
  const references = new Map();

  const seenOnce = new Set();
  const seenManyTimes = new Set();
  function countReferences(value) {
    if (value instanceof Object && !(value instanceof Function)) {
      if (seenOnce.has(value)) {
        seenManyTimes.add(value)
        // Skip counting for already seen objects to avoid infinite loops
        return;
      }
      seenOnce.add(value);
      
      // Recursively count references for object properties
      for (let key of Object.keys(value)) {
        countReferences(value[key]);
      }
    }
    return value;
  }
  
  // First pass to count references
  countReferences(obj);
  
  function replacer(key, value) {
    if (outerReplacer) {
      value = outerReplacer.call(this, key, value);
    }

    if (key === '$array') {
      return value;
    }

    if (value instanceof Object && !(value instanceof Function)) {
      if (!references.has(value)) {
        const needsId = seenManyTimes.has(value);
        let id
        if (needsId) {
          // 1st occurence of many: remember you saw that one
          id = uuid();
          references.set(value, id);
        }

        if (Array.isArray(value)) {
          return needsId ? { $id: id, $array: [...value] } : value;
        } else {
          const result = Object.assign(needsId ? { $id: id } : {}, value);

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

/**
 * @param outerReviver: gets called AFTER deserialization, with same key, value, and this reference as the original reviver would
 */
export function deserialize(json, classes = {}, outerReviver) {
  const idToObj = new Map();

  function reviver(key, value) {
    if (!value) {
      return value;
    }

    if (value.$ref) {
      // we have a ref before its definition -> create a stub based on the type
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

  function wrapper(key, value) {
    value = reviver.call(this, key, value);
    if (outerReviver) {
      value = outerReviver.call(this, key, value);
    }
    return value;
  }

  return JSON.parse(json, wrapper);
}