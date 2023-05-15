"disable deepeval"
import jsx from 'babel-plugin-jsx-lively';
import bind from 'babel-plugin-transform-function-bind';

export const defaultExample = () => ({
  id: 0,
  name: "script",
  color: "lightgray"
});

export const defaultInstance = () => ({
  id: 0,
  name: { value: "", isConnected: false },
});

export const defaultBabylonConfig = () => ({
  babelrc: false,
  plugins: [
    // jsx,
    // bind
  ],
  parserOpts: {
    plugins: [],
    errorRecovery: true
  },
  presets: [],
  filename: undefined,
  sourceFileName: undefined,
  moduleIds: false,
  sourceMaps: false,
  compact: false,
  comments: true,
  ast: true
});

export const defaultAnnotations = () => ({
  probes: [], // [Probe]
  sliders: [], // [Slider]
  examples: [], // [Example]
  replacements: [], // [Replacement]
  instances: [], // [Instance]
});

export const defaultContext = () => ({
  prescript: "",
  postscript: ""
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
