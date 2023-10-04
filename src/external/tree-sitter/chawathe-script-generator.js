// SOURCE: gumtree/core/src/main/java/com/github/gumtreediff/actions/ChawatheScriptGenerator.java


// Define the FakeTree, EditScript, Mapping, MappingStore, Tree, and other necessary classes and methods here, as they are not included in the provided code.

class FakeTree {

}

class MappingStore {

}


// SOURCE: gumtree/core/src/main/java/com/github/gumtreediff/actions/EditScript.java
class EditScript {
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

class Action {

}


class Insert extends Action {

}

class Delete extends Action {

}

class Move extends Action {

}


class Update extends Action {

}

class Mapping {

}

/**
 * An edit script generator based upon Chawathe algorithm.
 */
class ChawatheScriptGenerator {
  constructor() {
    this.origSrc = null;
    this.cpySrc = null;
    this.origDst = null;
    this.origMappings = null;
    this.cpyMappings = null;
    this.dstInOrder = new Set();
    this.srcInOrder = new Set();
    this.actions = null;
    this.origToCopy = new Map();
    this.copyToOrig = new Map();
  }

  computeActions(ms) {
    this.initWith(ms);
    this.generate();
    return this.actions;
  }

  deepCopyTree(tree) {
    // TODO
  }
  
  initWith(ms) {
    this.origSrc = ms.src;
    this.cpySrc = this.deepCopyTree(this.origSrc);
    this.origDst = ms.dst;
    this.origMappings = ms;

    this.origToCopy = new Map();
    this.copyToOrig = new Map();

    const cpyTreeIterator = this.preOrderIterator(this.cpySrc);
    for (const origTree of this.preOrder(this.origSrc)) {
      const cpyTree = cpyTreeIterator.next().value;
      this.origToCopy.set(origTree, cpyTree);
      this.copyToOrig.set(cpyTree, origTree);
    }

    this.cpyMappings = new MappingStore(ms.src, ms.dst);
    for (const m of this.origMappings) {
      this.cpyMappings.addMapping(this.origToCopy.get(m.first), m.second);
    }
  }

  generate() {
    const srcFakeRoot = new FakeTree(this.cpySrc);
    const dstFakeRoot = new FakeTree(this.origDst);
    this.cpySrc.setParent(srcFakeRoot);
    this.origDst.setParent(dstFakeRoot);

    this.actions = new EditScript();
    this.dstInOrder = new Set();
    this.srcInOrder = new Set();

    this.cpyMappings.addMapping(srcFakeRoot, dstFakeRoot);

    const bfsDst = this.breadthFirst(this.origDst);
    for (const x of bfsDst) {
      let w;
      const y = x.getParent();
      const z = this.cpyMappings.getSrcForDst(y);

      if (!this.cpyMappings.isDstMapped(x)) {
        const k = this.findPos(x);
        // Insertion case: insert new node.
        w = new FakeTree();
        // In order to use the real nodes from the second tree, we
        // furnish x instead of w
        const ins = new Insert(x, this.copyToOrig.get(z), k);
        this.actions.add(ins);
        this.copyToOrig.set(w, x);
        this.cpyMappings.addMapping(w, x);
        z.insertChild(w, k);
      } else {
        w = this.cpyMappings.getSrcForDst(x);
        if (!x.equals(this.origDst)) {
          const v = w.getParent();
          if (w.getLabel() !== x.getLabel()) {
            this.actions.add(new Update(this.copyToOrig.get(w), x.getLabel()));
            w.setLabel(x.getLabel());
          }
          if (!z.equals(v)) {
            const k = this.findPos(x);
            const mv = new Move(this.copyToOrig.get(w), this.copyToOrig.get(z), k);
            this.actions.add(mv);
            const oldk = w.positionInParent();
            w.getParent().getChildren().splice(oldk, 1);
            z.insertChild(w, k);
          }
        }
      }

      this.srcInOrder.add(w);
      this.dstInOrder.add(x);
      this.alignChildren(w, x);
    }

    for (const w of this.cpySrc.postOrder()) {
      if (!this.cpyMappings.isSrcMapped(w)) {
        this.actions.add(new Delete(this.copyToOrig.get(w)));
      }
    }

    return this.actions;
  }

  alignChildren(w, x) {
    this.srcInOrder.delete(...w.getChildren());
    this.dstInOrder.delete(...x.getChildren());

    const s1 = [];
    for (const c of w.getChildren()) {
      if (this.cpyMappings.isSrcMapped(c)) {
        if (x.getChildren().includes(this.cpyMappings.getDstForSrc(c))) {
          s1.push(c);
        }
      }
    }

    const s2 = [];
    for (const c of x.getChildren()) {
      if (this.cpyMappings.isDstMapped(c)) {
        if (w.getChildren().includes(this.cpyMappings.getSrcForDst(c))) {
          s2.push(c);
        }
      }
    }

    const lcsResult = this.lcs(s1, s2);

    for (const m of lcsResult) {
      this.srcInOrder.add(m.first);
      this.dstInOrder.add(m.second);
    }

    for (const b of s2) {
      for (const a of s1) {
        if (this.cpyMappings.has(a, b)) {
          if (!lcsResult.some(mapping => mapping.first === a && mapping.second === b)) {
            a.getParent().getChildren().splice(a.positionInParent(), 1);
            const k = this.findPos(b);
            const mv = new Move(this.copyToOrig.get(a), this.copyToOrig.get(w), k);
            this.actions.add(mv);
            w.getChildren().splice(k, 0, a);
            a.setParent(w);
            this.srcInOrder.add(a);
            this.dstInOrder.add(b);
          }
        }
      }
    }
  }

  findPos(x) {
    const y = x.getParent();
    const siblings = y.getChildren();

    for (const c of siblings) {
      if (this.dstInOrder.has(c)) {
        if (c === x) return 0;
        else break;
      }
    }

    const xpos = x.positionInParent();
    let v = null;
    for (let i = 0; i < xpos; i++) {
      const c = siblings[i];
      if (this.dstInOrder.has(c)) v = c;
    }

    if (v === null) return 0;

    const u = this.cpyMappings.getSrcForDst(v);
    const upos = u.positionInParent();
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
        if (this.cpyMappings.getSrcForDst(y[j]) === x[i]) {
          opt[i][j] = opt[i + 1][j + 1] + 1;
        } else {
          opt[i][j] = Math.max(opt[i + 1][j], opt[i][j + 1]);
        }
      }
    }

    let i = 0;
    let j = 0;
    while (i < m && j < n) {
      if (this.cpyMappings.getSrcForDst(y[j]) === x[i]) {
        lcsResult.push(new Mapping(x[i], y[j]));
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
