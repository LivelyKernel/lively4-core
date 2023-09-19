
// #Copy from /src/components/tools/lively-ast-treesitter-inspector.js
// #TODO extract... ?
await lively.loadJavaScriptThroughDOM("treeSitter", lively4url + "/src/external/tree-sitter/tree-sitter.js")

export const Parser = window.TreeSitter;

await Parser.init()
export const JavaScript = await Parser.Language.load(lively4url + "/src/external/tree-sitter/tree-sitter-javascript.wasm");




