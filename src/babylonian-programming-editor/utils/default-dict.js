/**
 * A python-style DefaultDict container.
 * Creates, adds and returns a new object for undefined keys
 */
export default class DefaultDict {
  constructor(defaultVal) {
    return new Proxy({}, {
      get: (target, name) => {
        if(!(name in target)) {
          if(typeof defaultVal === "function") {
            target[name] = defaultVal();
          } else {
            target[name] = defaultVal;
          }
        }
        return target[name];
      }
    });
  }
}