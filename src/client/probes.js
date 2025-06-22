
export const dirtyFlags = {}
export const lastValues = {}

globalThis.__probes__ = new Proxy({}, {
  set(obj, prop, value) {
    dirtyFlags[prop] = true;
    lastValues[prop] = value;
    return true;
  }
});
