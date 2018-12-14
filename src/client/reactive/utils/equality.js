// checks elements of arrays pairwise for identity equality
export function shallowEqualsArray(arr1, arr2) {
  if (arr1 === arr2) { return true; }
  if (arr1.length !== arr2.length) { return false; }

  for (let index = 0; index < arr1.length; index++) {
    if (arr1[index] !== arr2[index]) { return false; }
  }

  return true;
}

// checks elements for identity equality
export function shallowEqualsSet(set1, set2) {
  if (set1 === set2) { return true; }
  if (set1.size !== set2.size) return false;
  
  for (let val of set1) {
    if (!set2.has(val)) { return false; }
  }
  
  return true;
}

// checks keys and values for identity equality
export function shallowEqualsMap(map1, map2) {
  if (map1 === map2) { return true; }
  if (map1.size !== map2.size) return false;
  
  for (let [key, value] of map1.entries()) {
    if (value !== map2.get(key)) { return false; }
  }
  
  return true;
}


// checks all properties for identity equality
export function shallowEquals(obj1, obj2) {
  // strict equality
  if (obj1 === obj2) { return true; }
  
  // only for object-like values
  if (typeof obj1 !== "object" || !obj1 || typeof obj2 !== "object" || !obj2) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // same number of keys
  if (keys1.length !== keys2.length) {
    return false;
  }

  const hasOwnProperty2 = Object.prototype.hasOwnProperty.bind(obj2);

  // Test for A's keys different from B.
  for (let index = 0; index < keys1.length; index++) {
    const key = keys1[index];

    if (!hasOwnProperty2(key)) {
      return false;
    }

    const valueA = obj1[key];
    const valueB = obj2[key];

    if(valueA !== valueB) { return false; }
  }

  return true;
}


// deeply checks all properties for equality
export function deepEquals(objA, objB) {
  
  // objects that are already marked as compared
  const comparedObjects = new Map(); // Map<Object, Set<Object>>
  function ensureComparedObjectsFor(obj) {
    if(!comparedObjects.has(obj)) {
      comparedObjects.set(obj, new Set());
    }
  }
  function comparedObjectsHAS(obj, obj2) {
    ensureComparedObjectsFor(obj);
    return comparedObjects.get(obj).has(obj2);
  }
  function comparedObjectsADD(obj, obj2) {
    ensureComparedObjectsFor(obj);
    comparedObjects.get(obj).add(obj2);
  }

  function isAlreadyCompared(obj1, obj2) {
    return comparedObjectsHAS(obj1, obj2) || comparedObjectsHAS(obj2, obj1);
  }
  function markAsAlreadyCompared(obj1, obj2) {
    comparedObjectsADD(obj1, obj2);
    comparedObjectsADD(obj2, obj1);
  }

  const objectsStillToCompare = [[objA,objB]];
  
  let currentPair;
  while(currentPair = objectsStillToCompare.pop()) {
    const [obj1, obj2] = currentPair;
    
    // strict equality
    if (obj1 === obj2) { continue; }

    // only for object-like values
    if (typeof obj1 !== "object" || !obj1 || typeof obj2 !== "object" || !obj2) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // same number of keys
    if (keys1.length !== keys2.length) {
      return false;
    }

    const hasOwnProperty2 = Object.prototype.hasOwnProperty.bind(obj2);

    // Test for A's keys different from B.
    for (let index = 0; index < keys1.length; index++) {
      const key = keys1[index];

      if (!hasOwnProperty2(key)) {
        return false;
      }

      const valueA = obj1[key];
      const valueB = obj2[key];

      if(!isAlreadyCompared(valueA, valueB)) {
        markAsAlreadyCompared(valueA, valueB);
        objectsStillToCompare.push([valueA, valueB]);
      }
    }
  }

  return true;
}
