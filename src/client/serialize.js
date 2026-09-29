/**
 * @param outerReplacer: gets called BEFORE serialization, with same key, value, and this reference as the original replacer would
 */
export function serialize(obj, outerReplacer) {
  const references = new Map();
  let nextId = 1; // $id/$ref only need to be unique within this one call; a counter is ~free vs a crypto uuid()

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

      if (value instanceof Set) {
        for (const entry of value) {
          countReferences(entry);
        }
      } else if (value instanceof Map) {
        for (const [mapKey, mapValue] of value) {
          countReferences(mapKey);
          countReferences(mapValue);
        }
      } else {
        // Recursively count references for object properties
        for (let key of Object.keys(value)) {
          countReferences(value[key]);
        }
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

    if (key === '$array' || key === '$set' || key === '$map') {
      return value;
    }

    // JSON.stringify flattens Infinity/-Infinity/NaN to null; encode them so they round-trip.
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return { $num: value !== value ? 'NaN' : value > 0 ? 'Infinity' : '-Infinity' };
    }

    if (value instanceof Object && !(value instanceof Function)) {
      if (!references.has(value)) {
        const needsId = seenManyTimes.has(value);
        let id
        if (needsId) {
          // 1st occurence of many: remember you saw that one
          id = nextId++;
          references.set(value, id);
        }

        if (Array.isArray(value)) {
          return needsId ? { $id: id, $array: [...value] } : value;
        } else if (value instanceof Set) {
          const result = needsId ? { $id: id } : {};
          result.$set = [...value];
          return result;
        } else if (value instanceof Map) {
          const result = needsId ? { $id: id } : {};
          result.$map = [...value];
          return result;
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
        } else if (value instanceof Set) {
          reference.$isSet = true;
        } else if (value instanceof Map) {
          reference.$isMap = true;
        }

        return reference;
      }
    }

    return value;
  }

  // core-js (bundled with the transpiler) installs the withdrawn Set/Map.prototype.toJSON proposal,
  // which flattens Sets/Maps into plain arrays inside JSON.stringify *before* the replacer above can
  // run — losing collection type and shared-reference identity. It is (re)installed by ordinary
  // transpilation/workspace activity, so it can't be reliably dropped once at boot. Neutralize it
  // just for this stringify pass, restoring the exact descriptors afterwards (synchronous, so no
  // interleaving). Nothing relies on the non-standard behaviour (a Set stringifies to {} per spec).
  const setToJSON = Object.getOwnPropertyDescriptor(Set.prototype, 'toJSON');
  const mapToJSON = Object.getOwnPropertyDescriptor(Map.prototype, 'toJSON');
  if (setToJSON) delete Set.prototype.toJSON;
  if (mapToJSON) delete Map.prototype.toJSON;
  try {
    return JSON.stringify(obj, replacer, 2);
  } finally {
    if (setToJSON) Object.defineProperty(Set.prototype, 'toJSON', setToJSON);
    if (mapToJSON) Object.defineProperty(Map.prototype, 'toJSON', mapToJSON);
  }
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

    if (typeof value.$num === 'string') {
      return value.$num === 'NaN' ? NaN : Number(value.$num);
    }

    if (value.$ref) {
      // we have a ref before its definition -> create a stub based on the type
      return idToObj.getOrCreate(value.$ref, () =>
        value.$isArray ? [] :
        value.$isSet ? new Set() :
        value.$isMap ? new Map() :
        {});
    }

    if (value.$id) {
      const id = value.$id;
      delete value.$id;

      const array = value.$array;
      const set = value.$set;
      const map = value.$map;

      if (idToObj.has(id)) {
        const proxy = idToObj.get(id);

        if (array) {
          proxy.push(...array);
          value = proxy;
        } else if (set) {
          for (const entry of set) proxy.add(entry);
          value = proxy;
        } else if (map) {
          for (const [mapKey, mapValue] of map) proxy.set(mapKey, mapValue);
          value = proxy;
        } else {
          value = Object.assign(proxy, value);
        }
      } else {
        if (array) {
          value = array;
        } else if (set) {
          value = new Set(set);
        } else if (map) {
          value = new Map(map);
        }
        idToObj.set(id, value);
      }
    } else if (value.$set) {
      value = new Set(value.$set);
    } else if (value.$map) {
      value = new Map(value.$map);
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