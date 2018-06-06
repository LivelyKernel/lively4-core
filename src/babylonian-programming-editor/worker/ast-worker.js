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
  generateInstances,
  applyBasicModifications,
  applyTracker,
  applyContext,
} from "../utils/ast.js";


/**
 * Receive message from the main thread
 */
export default onmessage = function(msg) {
  const { code, annotations } = JSON.parse(msg.data.payload);

  // Process the code
  try {
    const ast = parse(code);
    applyBasicModifications(ast);
    const originalAst = deepCopy(ast);

    // Process AST
    generateLocationMap(ast);
    applyReplacements(ast, annotations.replacements);
    applyProbes(ast, annotations.probes);
    
    // Add trackers for all examples
    const exampleInstances = generateInstances(ast, annotations.instances);
    applyExamples(ast, annotations.examples, exampleInstances);
    
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




