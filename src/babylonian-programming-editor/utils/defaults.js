export const defaultExample = () => ({
  id: 0,
  name: "script",
  color: "lightgray"
});

export const defaultInstance = () => ({
  id: 0,
  name: { value: "null", isConnected: false },
});

export const defaultBabylonConfig = () => ({
  babelrc: false,
  plugins: [],
  presets: [],
  filename: undefined,
  sourceFileName: undefined,
  moduleIds: false,
  sourceMaps: false,
  compact: false,
  comments: false,
  resolveModuleSource: undefined
});

export const defaultAnnotations = () => ({
  probes: [], // [Probe]
  sliders: [], // [Slider]
  examples: [], // [Example]
  replacements: [], // [Replacement]
  instances: [], // [Instance]
});

let defaultConnectionsInstance = null;
export const defaultConnections = () => {
  if(!defaultConnectionsInstance) {
    defaultConnectionsInstance = new Proxy({}, {
      get(target, key) {
        if(key in target) {
          return target[key];
        } else {
          throw new Error(`The object referenced by "${key.split("_")[1]}" does not exist`);
        }
      }
    });
  }
  return defaultConnectionsInstance; 
}

export const guid = () => {
  // from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return  s4() + '-' + s4() + '-' + s4();
}

export const abstract = () => {
  throw Error("This function is abstract");
}