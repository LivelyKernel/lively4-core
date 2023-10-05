/*
 * This file is a modification / port of parts of GumTree.
 *
 * GumTree is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * GumTree is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with GumTree.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Copyright 2019 Jean-Rémy Falleri <jr.falleri@gmail.com>
 */


/*MD 

[test](edit://test/chawathe-script-generator-test.js)

MD*/


// SOURCE: gumtree/core/src/main/java/com/github/gumtreediff/actions/ChawatheScriptGenerator.java


// Define the FakeTree, EditScript, Mapping, MappingStore, Tree, and other necessary classes and methods here, as they are not included in the provided code.

import {visit, addMapping, getSrcForDst, getDstForSrc, isSrcMapped, isDstMapped, label, hasMapping, visitPostorder} from "src/client/tree-sitter.js"

function positionInParent(node) {
  return node.parent.children.indexOf(node)
}

function insertChild(node, child, index) {
  node.children.splice(index, 0, child);
}

function setLabel(node, label) {
  node.label = label
}

function getLabel(node) {
  node.label || label(node)
}



// SOURCE: gumtree/core/src/main/java/com/github/gumtreediff/actions/EditScript.java
export  class EditScript {
    constructor() {
        this.actions = [];
    }

    *[Symbol.iterator]() {
        for (const action of this.actions) {
            yield action;
        }
    }

    add(action) {
        this.actions.push(action);
    }

    addAtIndex(index, action) {
        this.actions.splice(index, 0, action);
    }

    get(index) {
        return this.actions[index];
    }

    size() {
        return this.actions.length;
    }

    remove(action) {
        const index = this.actions.indexOf(action);
        if (index !== -1) {
            this.actions.splice(index, 1);
            return true;
        }
        return false;
    }

    removeAtIndex(index) {
        if (index >= 0 && index < this.actions.length) {
            return this.actions.splice(index, 1)[0];
        }
        return null;
    }

    asList() {
        return [...this.actions];
    }

    lastIndexOf(action) {
        return this.actions.lastIndexOf(action);
    }
}

export class Action {
  get type() {
    throw new Error("subclass responsibility")
  }
}


export class Insert extends Action {
  get type() {
    return "insert"
  }
  
  constructor(node, parent, pos) {
    super()
    this.node = node
    this.parent = parent
    this.pos = pos
  }
  
}

export class Delete extends Action {
  get type() {
    return "delete"
  }
  
  constructor(node) {
    super()
    this.node = node
  }

}

export class Move extends Action {
  get type() {
    return "move"
  }

  constructor(node, parent, pos) {
    super()
    this.node = node
    this.parent = parent
    this.pos = pos
  }

}


export class Update extends Action {
  get type() {
    return "update"
  }

  constructor(node, value) {
    super()
    this.node = node
    this.value
  }
}

function* preOrderIterator(node) {
  yield node
  for (let i = 0; i < node.childCount; i++) {
    let ea = node.child(i)
    preOrderIterator(ea)
  }
}

/**
 * An edit script generator based upon Chawathe algorithm.
 */
export class ChawatheScriptGenerator {
  constructor(tree1, tree2, mappings) {
  }

  computeActions(tree1, tree2, mappings) {
    this.initWith(tree1, tree2, mappings);
    this.generate();
    return this.actions;
  }

  deepCopyTree(tree) {
    var copy = {id: tree.id, type: tree.type, label: label(tree), children: []}
    for(let ea of tree.children) {
      let c = this.deepCopyTree(ea)
      c.parent = copy
      copy.children.push(c)
    }
    return copy
  }
  
  initWith(tree1, tree2, mappings) {
    this.origSrc = tree1;
    this.cpySrc = this.deepCopyTree(this.origSrc);
    this.origDst = tree2;
    this.origMappings = mappings;

    this.origToCopy = new Map();
    this.copyToOrig = new Map();
    
    const cpyTreeIterator = preOrderIterator(this.cpySrc);
    
    visit(this.origSrc, origTree => {
      const cpyTree = cpyTreeIterator.next().value;
      if (cpyTree) {
        this.origToCopy.set(origTree.id, cpyTree);
        this.copyToOrig.set(cpyTree.id, origTree);            
      }
    })
    
    this.cpyMappings = mappings.clone()
    for (const m of this.origMappings) {
      var from = this.origToCopy.get(m.node1.id)
      if (from) {
        addMapping(this.cpyMappings, from, m.node2);
      }
    }
  }
  
  *breadthFirst(root) {
    if (!root) return 

    const queue = [root];

    while (queue.length > 0) {
      const currentNode = queue.shift(); // Dequeue the first node
      yield currentNode

      for(let ea of currentNode.children) {
        queue.push(ea); 
      }

    }
  }

  generate() {
    this.cpySrc
    this.origDst

    this.actions = new EditScript();
    this.dstInOrder = new Set();
    this.srcInOrder = new Set();


    const bfsDst = this.breadthFirst(this.origDst);
    for (const x of bfsDst) {
      let w;
      const y = x.parent;
      if (!y) continue // root
      
      const z = getSrcForDst(this.cpyMappings, y);

      if (!isDstMapped(this.cpyMappings, x)) {
        const k = this.findPos(x);
        // Insertion case: insert new node.
        w = {children: []};  
        // In order to use the real nodes from the second tree, we
        // furnish x instead of w
        const ins = new Insert(x, this.copyToOrig.get(z.id), k);
        this.actions.add(ins);
        this.copyToOrig.set(w.id, x);
        addMapping(this.cpyMappings, w, x);
        insertChild(z, w, k);
      } else {
        w = getSrcForDst(this.cpyMappings, x);
        if (!x.equals(this.origDst)) {
          const v = w.parent;
          if (getLabel(w) !== getLabel(x)) {
            this.actions.add(new Update(this.copyToOrig.get(w.id), getLabel(x)));
            setLabel(w, getLabel(x));
          }
          if (!z.equals(v)) {
            const k = this.findPos(x);
            const mv = new Move(this.copyToOrig.get(w.id), this.copyToOrig.get(z.id), k);
            this.actions.add(mv);
            const oldk = positionInParent(w);
            w.parent.children.splice(oldk, 1);
            insertChild(z, w, k);
          }
        }
      }

      this.srcInOrder.add(w);
      this.dstInOrder.add(x);
      this.alignChildren(w, x);
    }

    visitPostorder(this.cpySrc, w => {
      if (!isSrcMapped(this.cpyMappings, w)) {
        this.actions.add(new Delete(this.copyToOrig.get(w.id)));
      }
    })

    return this.actions;
  }

  alignChildren(w, x) {
    this.srcInOrder.delete(...w.children);
    this.dstInOrder.delete(...x.children);

    const s1 = [];
    for (const c of w.children) {
      if (isSrcMapped(this.cpyMappings, c)) {
        if (x.children.includes(getDstForSrc(this.cpyMappings, c))) {
          s1.push(c);
        }
      }
    }

    const s2 = [];
    for (const c of x.children) {
      if (isDstMapped(this.cpyMappings, c)) {
        if (w.children.includes(getSrcForDst(this.cpyMappings, c))) {
          s2.push(c);
        }
      }
    }

    const lcsResult = this.lcs(s1, s2);

    for (const m of lcsResult) {
      this.srcInOrder.add(m.node1);
      this.dstInOrder.add(m.node2);
    }

    for (const b of s2) {
      for (const a of s1) {
        if (hasMapping(this.cpyMappings, a, b)) {
          if (!lcsResult.some(mapping => mapping.node1 === a && mapping.node2 === b)) {
            a.parent.children.splice(positionInParent(a), 1);
            const k = this.findPos(b);
            const mv = new Move(this.copyToOrig.get(a.id), this.copyToOrig.get(w.id), k);
            this.actions.add(mv);
            w.children.splice(k, 0, a);
            a.setParent(w);
            this.srcInOrder.add(a);
            this.dstInOrder.add(b);
          }
        }
      }
    }
  }

  findPos(x) {
    const y = x.parent;
    const siblings = y.children;

    for (const c of siblings) {
      if (this.dstInOrder.has(c)) {
        if (c === x) return 0;
        else break;
      }
    }

    const xpos = positionInParent(x);
    let v = null;
    for (let i = 0; i < xpos; i++) {
      const c = siblings[i];
      if (this.dstInOrder.has(c)) v = c;
    }

    if (v === null) return 0;

    const u = getSrcForDst(this.cpyMappings, v);
    const upos = positionInParent(u);
    return upos + 1;
  }

  lcs(x, y) {
    const m = x.length;
    const n = y.length;
    const lcsResult = [];

    const opt = [];
    for (let i = 0; i <= m; i++) {
      opt[i] = new Array(n + 1).fill(0);
    }

    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        if (getSrcForDst(this.cpyMappings, y[j]) === x[i]) {
          opt[i][j] = opt[i + 1][j + 1] + 1;
        } else {
          opt[i][j] = Math.max(opt[i + 1][j], opt[i][j + 1]);
        }
      }
    }

    let i = 0;
    let j = 0;
    while (i < m && j < n) {
      if (getSrcForDst(this.cpyMappings, y[j]) === x[i]) {
        addMapping(lcsResult, x[i], y[j]);
        i++;
        j++;
      } else if (opt[i + 1][j] >= opt[i][j + 1]) {
        i++;
      } else {
        j++;
      }
    }

    return lcsResult;
  }

}
