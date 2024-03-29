/*MD 
[test](edit://test/tree-sitter-test.js) [demo](browse://demos/tree-sitter/matches.md)

MD*/

import PriorityQueue from "src/external/priority-queue.js"
import _ from 'src/external/lodash/lodash.js'

import { qGramsDifference } from "utils"

await lively.loadJavaScriptThroughDOM("treeSitter", lively4url + "/src/external/tree-sitter/tree-sitter.js")

export const Parser = window.TreeSitter;
await Parser.init()

import Strings from "src/client/strings.js"

export const JavaScript = await Parser.Language.load(lively4url +
  "/src/external/tree-sitter/tree-sitter-javascript.wasm");

export var javascriptParser = new Parser();
javascriptParser.setLanguage(JavaScript);


import { mapping as zhangShashaMapping } from "src/external/tree-edit-distance/zhang-shasha.js"


export function debugPrint(node) {
  let s = ""
  visit(node, ea => s += Strings.indent(ea.type  + " " + ea.id, depth(ea), "  ") + "\n")
  return s  
}

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
    visitPairs(ea1, ea2, func)
  }
}


export function visitPostorder(node, func) {
  for (let i = 0; i < node.childCount; i++) {
    let ea = node.child(i)
    visitPostorder(ea, func)
  }
  func(node)
}


export function query(node, s) {
  return node.tree.language.query(s).captures(node)
}

export function parseAll(sources) {
  return sources.map(ea => javascriptParser.parse(ea).rootNode)
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
  while (peekMax(priorityList) == height) {
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

// similarity coefficient


/*MD 

![](media/diceCoefficient.png){width=100px}
MD*/
export function dice(t1, t2, M) {
  let descendantsT1 = s(t1)
  let descendantsT2 = s(t2)
  let mappedElements = []

  // the ratio of common descendants between two nodes given a set of mappings M
  for (let m of M) {
    if (descendantsT1.has(m.node1.id) && descendantsT2.has(m.node2.id)) {
      mappedElements.push(m)
    }
  }

  // Return the Dice coefficient
  return 2 * mappedElements.length / (s(t1).size + s(t2).size);
}

function s(node) {
  if (!node) return new Map()

  // map of decendents of node
  var result = new Map() // we have to use the indirection via id, because object identity changes
  visit(node, ea => {
    result.set(ea.id, ea)
  })
  result.delete(node.id) // not myself
  return result
}

function open(node, priorityList) {
  for (let ea of node.children) {
    priorityList.push({ height: height(ea), node: ea })
  }
}


/*MD ![](media/Falleri2014FGA_alorighm1.png){width=400px} MD*/
export function depth(node) {
  if (!node.parent) return 0

  return  depth(node.parent) + 1
}

export function height(node) {
  /* "The height of a node t ∈ T is defined as: 
    1) for a leaf node t, height(t) = 1 and 
    2) for an internal node t, height(t) = max({height(c)|c ∈ children(t)}) + 1." 
  */

  if (node.childCount === 0) return 1

  if (!node.children) {
    debugger
  }
  
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
              visitPairs(t1, t2, (node1, node2) => addMapping(mappings, node1, node2,  {phase: "mapTrees_01"}))
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

    visitPairs(t1, t2, (node1, node2) => addMapping(mappings, node1, node2, {phase:"mapTrees_02"}))

    candidateMappings = candidateMappings.filter(pair => pair[0] !== t1);
    candidateMappings = candidateMappings.filter(pair => pair[1] !== t2);
  }

  return mappings;
}


function candidates(src, mappings) {
  /* "For each unmatched non-leaf node of T1, we extract a list of candidate nodes from T2. 
  A node c ∈ T2 is a candidate for t1 
    if label(t1) = label(c), 
      c is unmatched, 
      and t1 and c have some matching descendants." 
  
    [Falleri2014FGA] 
  */


  let seeds = [];
  for (let c of s(src).values()) {
    if (isSrcMapped(mappings, c)) {
      seeds.push(getDstForSrc(mappings, c));
    }
  }
  let candidatesList = [];
  let visited = new Set();
  for (let seed of seeds) {
    while (seed.parent !== null) {
      let parent = seed.parent;
      if (visited.has(parent.id)) break;
      visited.add(parent.id);
      if (parent.type === src.type && !isDstMapped(mappings, parent) && parent.parent) {
        candidatesList.push(parent);
      }
      seed = parent;
    }
  }
  return candidatesList;
}

/*MD ![](media/Falleri2014FGA_algorithm2.png){width=400px} MD*/
function isMatched(M, node) {
  return M.find(ea => ea.node1.id == node.id || ea.node2.id == node.id)
}


export function isSrcMapped(M, node) {
  if (!node) throw new Error("node is missing")

  return M.find(ea => ea.node1.id == node.id)
}

export function isDstMapped(M, node) {
  if (!node) throw new Error("node is missing")
  return M.find(ea => ea.node2.id == node.id)
}

export function getDstForSrc(M, node) {
  return isSrcMapped(M, node).node2
}

export function getSrcForDst(M, node) {
  return isDstMapped(M, node).node1
}


function hasMatchedChildren(M, t1) {
  return t1.children.find(ea => isMatched(ea, M))
}

export function label(node) {
  if (node.childCount === 0) {
    return node.text
  }
  return node.type
}

function isLeaf(node) {
  return node.childCount == 0
}


function lastChanceMatch(mappings, src, dst, maxSize) {
  if (s(src).size < maxSize || s(dst).size < maxSize) {
    var debugStartTime = performance.now()
    let zsMappings = zhangShashaMapping(src, dst,
      function children(node) { return node.children },
      function insertCost() { return 1 },
      function removeCost() { return 1 },
      function updateCost(from, to) {
        if (from.type === to.type) {
          return qGramsDifference(label(from), label(to), 2)
        } else {
          return 1
        }
      });
    debugLastChanceCounter++
    var debugTime = performance.now() - debugStartTime 
    
    for (let candidate of zsMappings) {
      if (candidate.t1 && candidate.t2) {
        if (!isSrcMapped(mappings, candidate.t1) && !isDstMapped(mappings, candidate.t2)) {
          addMapping(mappings, candidate.t1, candidate.t2, 
                     {phase: "lastChanceMatch", lastChanceCounter: debugLastChanceCounter, time: debugTime});
        }
      }
    }
  }
}

export function hasMapping(mappings, t1, t2) {
  if (!t1) throw new Error("t1 is missing")
  if (!t2) throw new Error("t2 is missing")

  return mappings.find(ea => ea.node2.id == t1.id &&  ea.node2.id == t2.id)
}

export function addMapping(mappings, t1, t2, debugInfo) {
  if (!t1) { throw new Error("t1 is null") }
  if (!t2) { throw new Error("t2 is null") }
  
  
  // if (t1.type !== t2.type  && t1.children.length > 0) {
  //   debugger
  //   throw new Error("mapping gone wrong?")
  // }
  mappings.push({ node1: t1, node2: t2, debugInfo: debugInfo})
}

var debugLastChanceCounter = 0

function bottomUpPhase(T1, dst, mappings, minDice, maxSize) {
  debugLastChanceCounter = 0
  
  visitPostorder(T1, t => {
    if (!t.parent) {
      if (!isSrcMapped(mappings, t)) {
        addMapping(mappings, t, dst, {phase: "bottomUpRoot"})
        lastChanceMatch(mappings, t, dst, maxSize);
      }
    } else if (!isSrcMapped(mappings, t) && !isLeaf(t)) {
      let candidatesList = candidates(t, mappings);
      let best = null;
      let max = -1;
      for (let cand of candidatesList) {
        let sim = dice(t, cand, mappings);
        if (sim > max && sim >= minDice) {
          max = sim;
          best = cand;
        }
      }

      if (best !== null) {
        lastChanceMatch(mappings, t, best, maxSize);
        addMapping(mappings, t, best, {phase: "bottomUp"})
      }
    }
  })
  return mappings;
}


export function match(tree1, tree2, minHeight = 2, maxSize = 100, minDice=0.5) {
  // "We recommend minHeight = 2 to avoid single identifiers to match everywhere." [Falleri2014FGA]
  // "maxSize is used in the recovery part of Algorithm 2 that can trigger a cubic algorithm. To avoid long computation times we recommend to use maxSize = 100."[Falleri2014FGA]
  // "Finally under 50% of common nodes, two container nodes are probably different. Therefore we recommend using minDice = 0.5"
  

  let matches = mapTrees(tree1, tree2, minHeight)

  
  bottomUpPhase(tree1, tree2, matches, minDice, maxSize)

  return Array.from(matches);
}
