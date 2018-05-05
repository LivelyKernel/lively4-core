// Custom imports
import {
  deepCopy,
  generateLocationMap,
  astForCode,
  codeForAst,
  assignIds,
  applyReplaceMarkers,
  applyProbeMarkers,
  applyExampleMarkers
} from "../utils/ast.js";


/**
 * Receive message from the main thread
 */
export default onmessage = function(msg) {
  const { code, markers } = JSON.parse(msg.data.payload);

  // Process the code
  try {
    const ast = parse(code);
    const originalAst = deepCopy(ast);

    // Process AST using markers
    generateLocationMap(ast);
    applyReplaceMarkers(ast, markers.replace);
    applyProbeMarkers(ast, markers.probe);
    applyExampleMarkers(ast, markers.example);

    // Generate executable code
    const executableCode = codeForAst(ast);

    // Send result
    return respond(msg.data.id, originalAst, executableCode);
  } catch (e) {
    console.error(e);
    return respond(msg.data.id);
  }
};

/**
 * Sends a response to the main thread
 */
const respond = (id, ast = null, code = null) =>
  /*postMessage*/({
    id: id,
    payload: {
      ast: ast,
      code: code
    }
  })/*;*/
  

/**
 * Parses code and returns the corresponding AST
 */
const parse = (code) =>
  assignIds(astForCode(code));




