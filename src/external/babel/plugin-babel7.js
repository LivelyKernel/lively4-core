export async function transformSource(load, babelOptions, config) {
    
    var output
    await SystemJS.import("src/external/babel/babel7.js")
    var babel7 =  window.lively4babel.babel

    let plugins = [
      window.lively4babel.babelPluginProposalExportDefaultFrom,
      window.lively4babel.babelPluginProposalExportNamespaceFrom,
      window.lively4babel.babelPluginSyntaxClassProperties,
      window.lively4babel.babelPluginNumericSeparator,
      window.lively4babel.babelPluginProposalDynamicImport,
      window.lively4babel.babelPluginTransformModulesSystemJS,
    ];

    let stage3Syntax = [
      'asyncGenerators', 
      'classProperties', 
      'classPrivateProperties', 
      'classPrivateMethods',
      'dynamicImport',
      'importMeta',
      'nullishCoalescingOperator',
      'numericSeparator',
      'optionalCatchBinding',
      'optionalChaining',
      'objectRestSpread', 
      'topLevelAwait'];


    try {
      output = babel7.transform(load.source, {
        filename: config.filename,
        sourceMaps: 'inline',
        ast: false,
        compact: false,
        sourceType: 'module',
        parserOpts: {
          plugins: stage3Syntax,
          errorRecovery: true
        },
        plugins: plugins
      });      
    } catch(e) {
      console.log("ERROR transpiling code with babel7:", e)
      throw e
    }
  return output
}
