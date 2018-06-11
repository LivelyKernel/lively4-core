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
