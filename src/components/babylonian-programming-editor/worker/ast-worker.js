// Package imports
import { babel } from 'systemjs-babel-build';
const { types, template, transform, transformFromAst, traverse } = babel;

// Custom imports
import { deepCopy, generateLocationMap } from "../utils/ast.js";


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
    const executableCode = generateCode(ast);

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
  assignIds(transform(code, {
      babelrc: false,
      plugins: [],
      presets: [],
      filename: undefined,
      sourceFileName: undefined,
      moduleIds: false,
      sourceMaps: false,
      compact: false,
      comments: true,
      code: false,
      ast: true,
      resolveModuleSource: undefined
    }).ast);

/**
 * Assigns IDs to add nodes of the AST
 */
const assignIds = (ast) => {
  let idCounter = 1;
  traverse(ast, {
    enter(path) {
      path.node._id = idCounter++;
    }
  });
  return ast;
};

/**
 * Applies replace markers to the given AST
 */
const applyReplaceMarkers = (ast, markers) => {
  // Apply the markers
  markers.forEach((marker) => {
    const replacementNode = marker.replacementNode;
    if(!replacementNode) {
      return;
    }
    const path = ast._locationMap[marker.loc];
    if(path.parentPath.isVariableDeclarator()) {
      path.parent.init = replacementNode;
    } else {
      path.replaceWith(replacementNode);
    }
  });
};

/**
 * Applies probe markers to the given AST
 */
const applyProbeMarkers = (ast, markers) => {
  const trackedIdentifiers = markers.map(marker => ast._locationMap[marker.loc].node);

  traverse(ast, {
    Identifier(path) {
      if(!trackedIdentifiers.includes(path.node)) {
        return;
      }
      
      insertIdentifierTracker(path);
    },
    BlockStatement(path) {
      insertBlockTracker(path);
    }
  });
};

/**
 * Applies example markers to the given AST
 */
const applyExampleMarkers = (ast, markers) => {
  // Prepare templates to insert
  const functionCall = template("ID()");
  const methodCall = template("CLASS.ID()");
  
  // Get tracked functions
  const exampleIdentifiers = markers.map(marker => ast._locationMap[marker.loc].node);
  const nodesToInsert = [];
  
  // Gather new nodes to insert
  traverse(ast, {
    Identifier(path) {
      if(!exampleIdentifiers.includes(path.node)) {
        return;
      }
      
      let nodeToInsert;
      const functionParent = path.getFunctionParent();
      if(functionParent.isClassMethod()) {
        const className = functionParent.getStatementParent().get("id").get("name").node;
        nodeToInsert = methodCall({
          CLASS: types.identifier(className),
          ID: types.identifier(path.node.name)
        });
      } else {
        nodeToInsert = functionCall({
          ID: types.identifier(path.node.name)
        });
      }
      nodesToInsert.push(nodeToInsert);
    }
  });
  
  // Insert collected new nodes
  nodesToInsert.map(n => ast.program.body.push(n));
}

/**
 * Insers an appropriate tracker for the given identifier path
 */
const insertIdentifierTracker = (path) => {
  // Prepare Trackers
  const tracker = template("window.__tracker.id(ID, VALUE)")({
    ID: types.numericLiteral(path.node._id),
    VALUE: types.identifier(path.node.name)
  });

  // Find the closest parent statement
  let statementParentPath = path.getStatementParent();

  // Check if the parent statement is a a BlockParent
  // In this case, we have to insert into the block body
  if(statementParentPath.isBlockParent()) {

    // The init part of a ForStatement is only executed once,
    // So we don't want to add the tracker to the body
    /*if(statementParentPath.isForStatement()
       && path.getPathLocation().indexOf(`${statementParentPath.getPathLocation()}.init`) === 0) {
      statementParentPath.get("init").get("declarations").push(assignedTracker.declarations[0]);
    }*/

    // Get body
    // TODO: Fix for if and switch
    const body = statementParentPath.get("body");
    if(body instanceof Array) {
      body.unshift(tracker);
    } else if (body.isBlockStatement()) {
      body.unshiftContainer("body", tracker);
    } else {
      body.replaceWith(
        types.blockStatement([
          body
        ])
      );
      body.unshiftContainer("body", tracker);
    }
  } else {
    statementParentPath.insertAfter(tracker);
  }
};

/**
 * Inserts a tracker to check whether a block was entered
 */
const insertBlockTracker = (path) => {
  const tracker = template("window.__tracker.block(ID)")({
    ID: types.numericLiteral(path.node._id)
  });
  path.unshiftContainer("body", tracker);
};

/**
 * Generates executable code for a given AST
 */
const generateCode = (ast) =>
  transformFromAst(ast, {
    babelrc: false,
    plugins: [],
    presets: [],
    filename: undefined,
    sourceFileName: undefined,
    moduleIds: false,
    sourceMaps: false,
    compact: false,
    comments: true,
    code: true,
    ast: false,
    resolveModuleSource: undefined
  }).code;
