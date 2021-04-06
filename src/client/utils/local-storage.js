export function loadJSON(key) {
  const stringValue = this.getItem(key);
  if (stringValue === null) {
    return undefined;
  }
  return JSON.parse(stringValue);
}

export function saveJSON(key, json) {
  const stringValue = JSON.stringify(json, undefined, 2);
  return this.setItem(key, stringValue);
}

export function hasItem(key) {
  return this.getItem(key) !== null;
}

