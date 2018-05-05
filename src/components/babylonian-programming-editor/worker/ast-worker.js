// Package imports
import { babel } from 'systemjs-babel-build';
const { 
  types, 
  template, 
  traverse
} = babel;

// Custom imports
import {
  deepCopy,
  generateLocationMap,
  astForCode,
  codeForAst
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
  const functionCall = template("ID.apply(THIS, PARAMS)");
  const methodCall = template("CLASS.ID.apply(THIS, PARAMS)");
  
  // Apply the markers
  markers.forEach((marker) => {
    let parametersNode = marker.replacementNode;
    if(!parametersNode) {
      parametersNode = types.nullLiteral();
    }
    const path = ast._locationMap[marker.loc];
    const functionParent = path.getFunctionParent()
    let nodeToInsert;
    
    // Distinguish between Methods and Functions
    if(functionParent.isClassMethod()) {
      const className = functionParent.getStatementParent().get("id").get("name").node;
      nodeToInsert = methodCall({
        CLASS: types.identifier(className),
        ID: types.identifier(path.node.name),
        THIS: types.nullLiteral(),
        PARAMS: parametersNode
      });
    } else {
      nodeToInsert = functionCall({
        ID: types.identifier(path.node.name),
        THIS: types.nullLiteral(),
        PARAMS: parametersNode
      });
    }
    
    // Insert a call at the end of the script
    if(nodeToInsert) {
      ast.program.body.push(nodeToInsert);
    }
  });
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

  // We have to insert the tracker at different positions depending on
  // the context of the tracked Identifier
  // TODO: Handle switch
  if(path.parentKey === "params") {
    // We are in a parameter list
    // Prepend tracker to body of function
    const functionParentPath = path.getFunctionParent();
    functionParentPath.get("body").unshiftContainer("body", tracker);
  } else if(statementParentPath.isBlockParent()) {
    // We are in a block
    // Insert into the block body
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
  } else if(statementParentPath.isIfStatement()) {
    // We are in an if
    // We have to insert the tracker before the if
    statementParentPath.insertBefore(tracker);
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


