export default function () {
  return {
    manipulateOptions(opts, parserOpts) {
      // parserOpts.plugins.push("*");
      parserOpts.plugins.push("classProperties");
      // parserOpts.plugins.push("classPrivateProperties");
      // parserOpts.plugins.push("classPrivateMethods");
    }
  };
}
