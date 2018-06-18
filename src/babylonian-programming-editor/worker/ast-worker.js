// Custom imports
import {
  deepCopy,
  generateLocationMap,
  astForCode,
  codeForAst,
  assignIds,
  applyReplacements,
  applyProbes,
  applyExamples,
  applyInstances,
  applyBasicModifications,
  applyTracker,
  applyContext,
} from "../utils/ast.js";


/**
 * Receive message from the main thread
 */
export default onmessage = function(msg) {
  const { code, annotations, customInstances, sourceUrl } = JSON.parse(msg.data.payload);

  // Process the code
  try {
    const ast = parse(code);
    ast._sourceUrl = sourceUrl;
    applyBasicModifications(ast);
    const originalAst = deepCopy(ast);

    // Process AST
    generateLocationMap(ast);
    applyReplacements(ast, annotations.replacements);
    applyProbes(ast, annotations.probes);
    
    // Add trackers for all examples
    applyInstances(ast, annotations.instances, customInstances);
    applyExamples(ast, annotations.examples);
    
    // Apply context
    applyContext(ast, annotations.context);
    
    // Insert tracker
    applyTracker(ast);

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




