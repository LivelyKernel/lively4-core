import Morph from 'src/components/widgets/lively-morph.js';

export default class OffsetParentInner extends Morph {
  async initialize() {
    this.windowTitle = "OffsetParentInner";
    this.registerButtons();
    this.onTestButton()
  }

  onTestButton() {
    this.listOffsetParents();
    this.listAllParents();
  }

  // #TODO: duplicated code with lively.offsetAncestry, due to https://bugs.chromium.org/p/chromium/issues/detail?id=1334556
  listOffsetParents() {
    const parents = [];
    let parent = this.get('#testButton');

    do {
      parents.push(parent);
      // lively.showElement(parent);
    } while (parent = parent.offsetParent);

    this.listHierarchyIn(parents, '#offsetParents')
  }

  listAllParents() {
    let element = this.get('#testButton');
    const parents = lively.ancestry(element);
    this.listHierarchyIn(parents, '#allParents')
  }

  listHierarchyIn(parents, listId) {
    const items = parents.map(::this.itemForElement);
    const allParents = this.get(listId);
    allParents.innerHTML = '';
    allParents.append(...items);
  }

  itemForElement(element) {
    const item = <li>{lively.elementPrinter.tagName.id.classes.offset(element)} <i class="fa fa-arrow-right" style="color: gray" /> {lively.elementPrinter.tagName.id.classes(element.offsetParent)}</li>;
    item.addEventListener('mousemove', evt => {
      if (this.highlight) {
        this.highlight.remove();
      }
      this.highlight = lively.showElement(element);
    });

    return item;
  }

}