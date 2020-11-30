import { uuid } from 'utils';

export function serialize(obj) {
  const references = new Map();

  function replacer(key, value) {
    if (value instanceof Object && !(value instanceof Function)) {
      if (!references.has(value)) {
        // 1st occurence: remember you saw that one
        const id = uuid();
        references.set(value, id);
        const result = Object.assign({ $id: id }, value);
        
        const classToRemember = value.__proto__.constructor;
        if (classToRemember !== Object) {
          result.$class = classToRemember.name;
        }
        
        return result;
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
    if (!value) {
      return value;
    }

    if (value.$ref) {
      return idToObj.getOrCreate(value.$ref, () => ({}));
    }

    if (value.$id) {
      const id = value.$id;
      delete value.$id;

      if (idToObj.has(id)) {
        const proxy = idToObj.get(id);
        
        value = Object.assign(proxy, value);
      } else {
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