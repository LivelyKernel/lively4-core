import Morph from 'src/components/widgets/lively-morph.js';
import { sortAlphaNum } from 'src/client/sort.js';

export default class TreeViewNode extends Morph {
  static get observedAttributes() { return ['isExpanded']; }

  static async create(key, target) {
    const child = await lively.create("lively-tree-view-node");
    child.key = key;
    child.target = target;
    return child;
  }

  async initialize() {
    this.resetTreeChildren();
  }

  get isTreeViewNode() { return true }

  get isExpanded() { return this.getAttribute('isExpanded') }
  set isExpanded(value) { this.setAttribute('isExpanded', value) }

  get key() { return this.getAttribute('key') }
  set key(value) { this.setAttribute('key', value) }

  get treeChildNodes() {
    return Object.values(this.treeChildren);
  }

  get path() { return this.gatherPath([]) }

  gatherPath(successors) {
    if (this.key) {
      successors.unshift(this.key);
      if (this.parent) this.parent.gatherPath(successors);
    }
    return successors;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'isExpanded' && !newValue !== !oldValue) {
      this.render();
    }
  }

  async render() {
    this.innterHTML='';
    await this.updateTreeChildren();
    this.view.renderNode(this);
  }

  renderChildren() {
    this.treeChildNodes.forEach(child => child.render());
  }

  attachHandlers(handlers) {
    for (const [tag, action] of Object.entries(handlers)) {
      this.querySelectorAll(tag).forEach(element => {
        action.call(element, this);
      })
    }
  }

  expand() {
    this.isExpanded = true;
  }

  collapse() {
    this.isExpanded = false;
  }

  toggleExpansion() {
    this.isExpanded = !this.isExpanded;
  }

  resetTreeChildren() {
    this.treeChildren = {};
  }

  async gatherTreeChildren() {
    for (const [key, target] of this.view.queryNode(this)) {
      await this.createTreeChild(key, target);
    }
  }

  async updateTreeChildren() {
    this.resetTreeChildren();
    await this.gatherTreeChildren();
  }

  async createTreeChild(key, target) {
    const child = await TreeViewNode.create(key, target);
    child.parent = this;
    child.view = this.view;
    this.treeChildren[key] = child;
    return child;
  }

  getTreeChild(key, expandIfNecessary = true) {
    if (!this.isExpanded) {
      if (!expandIfNecessary) return null;
      this.expand();
    }
    return this.treeChildren[key];
  }

  getTreeDescendent(keys, expandIfNecessary = true) {
    let node = this;
    for (const key of keys) {
      node = node.getTreeChild(key, expandIfNecessary);
      if (!node) return null;
    }
    return node;
  }

  select() {
    //TODO
  }

  deselect() {
    //TODO
  }

  focus() {
    //TODO
  }

}