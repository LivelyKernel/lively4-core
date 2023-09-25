/*MD 
[test](edit://test/tree-sitter-test.js) [demo](browse://demos/tree-sitter/matches.md)

MD*/
import PriorityQueue from "src/external/priority-queue.js"
import _ from 'src/external/lodash/lodash.js'


await lively.loadJavaScriptThroughDOM("treeSitter", lively4url + "/src/external/tree-sitter/tree-sitter.js")

export const Parser = window.TreeSitter;

await Parser.init()
export const JavaScript = await Parser.Language.load(lively4url +
  "/src/external/tree-sitter/tree-sitter-javascript.wasm");


export function visit(node, func) {
  func(node)
  for (let i = 0; i < node.childCount; i++) {
    let ea = node.child(i)
    visit(ea, func)
  }
}

// pairwise visit two isomorphic trees
export function visitPairs(node1, node2, func) {
  func(node1, node2)
  for (let i = 0; i < node1.childCount; i++) {
    let ea1 = node1.child(i)
    let ea2 = node2.child(i)
    visitPairs(ea1,ea2, func)
  }
}


export function visitPostorder(node, func) {
  for (let i = 0; i < node.childCount; i++) {
    let ea = node.child(i)
    visitPostorder(ea, func)
  }
  func(node)
}


/*MD SOURCE: Falleri 2014. Fine-grained and Accurate Source Code Differencing  <bib://Falleri2014FGA> MD*/

function root(node) {
  return node.tree.rootNode
}

export function peekMax(priorityList) {
  var result = priorityList.peek()
  return result && result.height
}

export function pop(priorityList) {  
  // "pop(l) returns and removes from l the set of all nodes of l having a height equals to peekMax(l)
  var result = new Set();
  var height = peekMax(priorityList)
  if (!height) return new Set()
  while(peekMax(priorityList) == height) {
    result.add(priorityList.pop().node)
  }
  return result
}


// Define a function to check if two subtrees are isomorphic
export function isomorphic(node1, node2) {
  if (!node1 && !node2) {
    // Both nodes are null, they are isomorphic
    return true;
  }

  if (!node1 || !node2) {
    // One of the nodes is null, they are not isomorphic
    return false;
  }

  if (node1.type !== node2.type) {
    // Node types are different, they are not isomorphic
    return false;
  }

  // Recursively check the child nodes
  const children1 = node1.children || [];
  const children2 = node2.children || [];

  if (children1.length !== children2.length) {
    // Different number of child nodes, they are not isomorphic
    return false;
  }

  for (let i = 0; i < children1.length; i++) {
    if (!isomorphic(children1[i], children2[i])) {
      // Child subtrees are not isomorphic, so the subtrees are not isomorphic
      return false;
    }
  }
  
  if (children1.length === 0) {
    return label(node1) === label(node2)
  }

  return true;
}

function dice(t1, t2, M) {
  // Extract elements of s(t1) that are mapped with t2 in M
  const mappedElements = Array.from(s(t1)).filter(t => M.has([t, t2]));

  // Return the Dice coefficient
  return 2 * mappedElements.length / (s(t1).length + s(t2).length);
}

function s(node) {
  // set of decendents of node
  var result = new Set()
  visit(node, ea => result.add(ea))
  result.delete(node) // not myself
  return result
}

function open(node, priorityList) {
  for(let ea of node.children) {
    priorityList.push({height: height(ea), node: ea})
  }
}


/*MD ![](media/Falleri2014FGA_alorighm1.png){width=400px} MD*/
export function height(node) {
  /* "The height of a node t ∈ T is defined as: 
    1) for a leaf node t, height(t) = 1 and 
    2) for an internal node t, height(t) = max({height(c)|c ∈ children(t)}) + 1." 
  */

  if (node.childCount === 0) return 1

  return _.max(node.children.map(ea => height(ea))) + 1
}

export function mapTrees(T1, T2, minHeight) {
  let L1 = new PriorityQueue((a, b) => a.height > b.height),
    L2 = new PriorityQueue((a, b) => a.height > b.height),
    candidateMappings = [],
    mappings = [];

  L1.push({ height: height(T1), node: T1 });
  L2.push({ height: height(T2), node: T2 });

  while (Math.min(peekMax(L1), peekMax(L2)) > minHeight) {
    
    if (peekMax(L1) !== peekMax(L2)) {
      if (peekMax(L1) > peekMax(L2)) {
        for (let t of pop(L1)) {
          open(t, L1);
        }
      } else {
        for (let t of pop(L2)) {
          open(t, L2);
        }
      }
    } else {
      const H1 = pop(L1);
      const H2 = pop(L2);
      
      for (let t1 of H1) {
        for (let t2 of H2) {
          if (isomorphic(t1, t2)) {
            let existTxT2
            let existTxT1
            
            visit(T2, tx => {
              if (isomorphic(t1, tx) && tx !== t2) {
                existTxT2 = true
              }
            });
            visit(T1, tx => {
              if (isomorphic(tx, t2) && tx !== t1) {
                existTxT1 = true
              }
            });
          
            if (existTxT2 || existTxT1) {
              candidateMappings.push([t1, t2]);
            } else {
              visitPairs(t1, t2, (node1, node2) => mappings.push({node1: node1, node2: node2}))
            }
          }
        }
      }

      for (let t1 of H1) {
        if (!candidateMappings.find(pair => pair[0] === t1) && !mappings.find(ea => ea.node1 == t1)) {
          open(t1, L1);
        }
      }

      for (let t2 of H2) {
        if (!candidateMappings.find(pair => pair[1] === t2) && !mappings.find(ea => ea.node2 == t2)) {
          open(t2, L2);
        }
      }
    }
  }

  candidateMappings.sort((a, b) => dice(a[0].parent, b[0].parent, mappings));

  while (candidateMappings.length > 0) {
    const [t1, t2] = candidateMappings.shift();

    visitPairs(t1, t2, (node1, node2) => mappings.push({node1: node1, node2: node2}))

    candidateMappings = candidateMappings.filter(pair => pair[0] !== t1);
    candidateMappings = candidateMappings.filter(pair => pair[1] !== t2);
  }

  return mappings;
}


function candidate(t, M) {
  /* "For each unmatched non-leaf node of T1, we extract a list of candidate nodes from T2. A node c ∈ T2 is a candidate for t1 if label(t1) = label(c), c is unmatched, and t1 and c have some matching descendants. We then select the candidate t2 ∈ T2 with the greatest dice(t1, t2,M) value. If dice(t1, t2,M) > minDice, t1 and t2 are matched together." [Falleri2014FGA] */
}

/*MD ![](media/Falleri2014FGA_algorithm2.png){width=400px} MD*/
function isMatched(node, M) {
  // TODO
}

function hasMatchedChildren(t1, M) {
  // TODO
}

function opt(node1, node2) {
  "finds a shortest edit script without move actions. In our implementation we use the RTED algorithm [27]. The mappings induced from this edit script are added in M if they involve nodes with identical labels."
}

function label(node) {
  if (node.childCount === 0) {
    return node.text
  }
  return node.type
}

function bottomUpPhase(T1, T2, M, minDice, maxSize) {

  visitPostorder(T1, t1 => {
    if (!isMatched(t1, M) && hasMatchedChildren(t1, M)) {
      let t2 = candidate(t1, M);
      if (t2 !== null && dice(t1, t2, M) > minDice) {
        M.add([t1, t2]);
        if (Math.max(s(t1).size, s(t2)).size < maxSize) {
          let R = opt(t1, t2);
          for (let [ta, tb] of R) {
            if (!isMatched(ta, M) && !isMatched(tb, M) && label(ta) === label(tb)) {
              M.add([ta, tb]);
            }
          }
        }
      }
    }
  })
  return M;
}

// Helper functions like postOrder, isMatched, hasMatchedChildren, candidate, dice, 
// s, size, opt, and label will need to be defined based on your specific requirements.


export function match(tree1, tree2) {

  // "We recommend minHeight = 2 to avoid single identifiers to match everywhere." [Falleri2014FGA]
  let minHeight = 2
  
  
  debugger
  let matches = mapTrees(tree1, tree2, minHeight)

  // "maxSize is used in the recovery part of Algorithm 2 that can trigger a cubic algorithm. To avoid long computation times we recommend to use maxSize = 100."[Falleri2014FGA]
  let maxSize = 100

  // "Finally under 50% of common nodes, two container nodes are probably different. Therefore we recommend using minDice = 0.5"
  let minDice = 0.5
  // bottomUpPhase(tree1, tree2, matches, minDice, maxSize)

  return Array.from(matches);
}
