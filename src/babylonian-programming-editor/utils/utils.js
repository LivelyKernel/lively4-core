export const maybeUnpackString = (value) => {
  if(typeof(value) === "string") {
    return value;
  } else if (typeof(value.value) === "string") {
    return value.value;
  }
  return null;
}

export const guid = () => {
  // from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return  s4() + '_' + s4() + '_' + s4();
}

export const abstract = () => {
  throw Error("This function is abstract");
}

export const compareKeyLocations = (a, b) => {
  return a[0] - b[0] ? a[0] - b[0] :
         a[1] - b[1] ? a[1] - b[1] :
         a[2] - b[2] ? a[2] - b[2] :
         a[3] - b[3] ? a[3] - b[3] :
         0;
}

export const keyLocationsAreEqual = (a, b) => {
  return compareKeyLocations(a, b) === 0;
}

export const stringInsert = (baseString, insertString, index) => {
  return baseString.slice(0, index) + insertString + baseString.slice(index);
}

export const stringRemove = (baseString, startIndex, endIndex) => {
  return baseString.slice(0, startIndex) + baseString.slice(endIndex);
}