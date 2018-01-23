export default function () {
  return {
    manipulateOptions(opts, parserOpts) {
      let plugins = 'estree,jsx,flow,flowComments,typescript,doExpressions,objectRestSpread,decorators,decorators2,classProperties,classPrivateProperties,classPrivateMethods,exportDefaultFrom,exportNamespaceFrom,asyncGenerators,functionBind,functionSent,dynamicImport,numericSeparator,optionalChaining,importMeta,bigInt,optionalCatchBinding,throwExpressions,pipelineOperator,nullishCoalescingOperator'
        .split(',')
        .map(plugin => parserOpts.plugins.push(plugin));
    }
  };
}
