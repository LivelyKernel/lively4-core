
export default function({ types: t }) {
  return {
    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push("allowAwaitOutsideFunction ");
    },
    visitor: {
      Program(path) {

      }
    }
  };
}
