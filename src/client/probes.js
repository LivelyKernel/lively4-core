export const dirtyFlags = {}
export const lastValues = {}
export const counts = {}

const recentValues = {} // a circular buffer
const numberOfRecentValuesToTrack = 10;

export function getOldestToMostRecentValues(probeId) {
  function getValues(values) {
    if (!values) {
      return []
    }

    const start = counts[probeId] % numberOfRecentValuesToTrack
    return values.slice(start).concat(values.slice(0, start))
  }

  return getValues(recentValues[probeId])
}
  
// #TODO
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
    
    const recent = recentValues[prop]
    if (recent) {
      recent[(counts[prop] - 1) % numberOfRecentValuesToTrack] = value
    } else {
      recentValues[prop] = [value]
    }
    
    return true;
  }
});
