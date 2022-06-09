import Morph from 'src/components/widgets/lively-morph.js';

export default class OffsetParentTest extends Morph {
  async initialize() {
    this.windowTitle = "OffsetParentTest";
    this.registerButtons();
  }

  onTestButton() {
    lively.notify('tests');
    this.listOffsetParents();
    this.listAllParents();
  }

  listOffsetParents() {
    const parents = [];
    let parent = this.get('#testButton');

    do {
      parents.push(parent);
      // lively.showElement(parent);
    } while (parent = parent.offsetParent);

    const items = parents.map(::this.itemForElement);
    const offsetParents = this.get('#offsetParents');
    offsetParents.append(...items);
  }

  listAllParents() {
    let element = this.get('#testButton');
    const items = lively.allParents(element, undefined, true).map(::this.itemForElement);
    const offsetParents = this.get('#allParents');
    offsetParents.append(...items);
  }

  itemForElement(element) {
    const item = <li >{element.tagName}{element.id ? `#${element.id}` : ''}{element.classList && element.classList.length > 0 ? '.' + Array.prototype.join.call(element.classList, '.') : ''}</li>;
    item.addEventListener('mousemove', evt => {
      if (this.highlight) {
        this.highlight.remove()
      }
      this.highlight = lively.showElement(element);
    })

    return item;
  }

}