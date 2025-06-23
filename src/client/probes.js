
export const dirtyFlags = {}
export const lastValues = {}
export const counts = {}

export function reset() {
  
}

globalThis.__probes__ = new Proxy({}, {
  set(obj, prop, value) {
    dirtyFlags[prop] = true;
    lastValues[prop] = value;
    if (counts[prop]) {
      counts[prop]++
    } else {
      counts[prop] = 1
    }
    return true;
  }
});
