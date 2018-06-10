export const maybeUnpackString = (value) => {
  if(typeof(value) === "string") {
    return value;
  } else if (typeof(value.value) === "string") {
    return value.value;
  }
  return null;
}