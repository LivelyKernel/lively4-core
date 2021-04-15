/*MD # Lively Menu

![](lively-menu.png){height=200}


MD*/

import Morph from 'src/components/widgets/lively-morph.js';
import { pt } from 'src/client/graphics.js';
import html from 'src/client/html.js';

class Entry {
  static fromDescription(desc) {
    if (Array.isArray(desc)) {
      return this.fromArray(desc);
    } else if (desc instanceof String) {
      // #TODO: convert the String '---' into a <hl />
    } else {
      // #TODO: Object
    }
  }
  
  static fromArray([name, callbackOrChildren, right, icon, options = {}]) {
    const { onSelect, onDeselect } = options;
    const entry = new Entry();

    entry.name = name;
    entry.callbackOrChildren = callbackOrChildren;
    if (callbackOrChildren instanceof Function) {
      entry.callback = callbackOrChildren;
    } else if(callbackOrChildren instanceof Array || callbackOrChildren instanceof Promise) {
      entry.children = callbackOrChildren;
    }
    entry.right = right;
    entry.icon = icon;
    entry.selectHandler = onSelect;
    entry.deselectHandler = onDeselect;

    return entry;
  }

  asItem(menu) {
    const item = document.createElement("li");
    item.entry = this;
    const iconHTML = `<div class='icon'>${this.icon || ""}</div>`;
    const right = <label>{this.right ? this.right.replace ? this.right.replace("CMD", "Ctrl") : this.right : ""}
      <span class="submenuindicator">{this.children ? <span>►</span> : " "}</span>
    </label>;

    item.innerHTML = iconHTML + this.name;
    item.appendChild(right);

    if (this.callback) {
      item.addEventListener("click", evt => this.callback(evt, item));
    }

    item.addEventListener("mouseenter", async evt => {
      if (menu.matchingItems.includes(item)) {
        menu.selectItem(item);
      }
    });

    return item;
  }

  matchesFilter(filter) {
    return typeof this.name === 'string' && this.name.toLowerCase().includes(filter.toLowerCase());
  }

  selected() {
    if (this.selectHandler) {
      this.selectHandler();
    }
  }
  deselected() {
    if (this.deselectHandler) {
      this.deselectHandler();
    }
  }
}

const FILTER_KEY_BLACKLIST = ['Control', 'Shift', 'Capslock', 'Alt', ' ', 'Enter', 'Escape', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Tab'];

export default class LivelyMenu extends Morph {
  initialize() {
    this.setAttribute("tabindex", 0 // we want keyboard events
    );html.registerKeys(this, "Menu", this, true);
  }

  moveInsideWindow() {
    var w = pt(window.innerWidth - 12, window.innerHeight - 12);
    var b = lively.getGlobalBounds(this);
    var original = b.topLeft();

    if (b.bottom() > w.y) {
      b.y -= b.bottom() - w.y;
    }
    if (b.right() > w.x) {
      b.x -= b.right() - w.x;
    }
    if (b.left() < 0) {
      b.x -= b.left();
    }
    if (b.top() < 0) {
      b.y -= b.top();
    }

    var delta = b.topLeft().subPt(original
    // lively.moveBy(this.topLevelMenu(), delta)
    );if (this.parentMenu) {
      if (delta.x < 0) {
        delta.x -= lively.getExtent(this.parentMenu).x;
      }
    }
    lively.moveBy(this, delta);

    return delta;
  }

  topLevelMenu() {
    if (!this.parentMenu) {
      return this;
    } else {
      return this.parentMenu.topLevelMenu();
    }
  }

  // lazy filter property
  get filter() {
    return this._filter = this._filter || '';
  }
  set filter(value) {
    return this._filter = value;
  }

  onKeyDown(evt) {
    if (FILTER_KEY_BLACKLIST.includes(evt.key)) {
      return;
    }

    if (['Backspace', 'Delete'].includes(evt.key)) {
      this.filter = '';
    } else {
      this.filter += evt.key;
    }

    this.get('#filter-hint').innerHTML = this.filter;

    // lively.warn(evt.key, this.filter)

    this.items.forEach(item => item.classList.remove('filtered-out'));
    this.nonMatchingItems.forEach(item => item.classList.add('filtered-out'));

    // lively.notify(this.matchingItems.length, this.nonMatchingItems.length)
    if (!this.currentItem || this.nonMatchingItems.includes(this.currentItem) && this.matchingItems.length > 0) {
      this.selectItem(this.matchingItems[0]);
    }
  }

  get items() {
    return Array.from(this.get(".container").querySelectorAll("li"));
  }

  matchFilter(item) {
    return item && item.entry && item.entry.matchesFilter(this.filter);
  }

  get matchingItems() {
    return this.items.filter(item => this.matchFilter(item));
  }

  get nonMatchingItems() {
    return this.items.filter(item => !this.matchFilter(item));
  }

  onSpaceDown(evt) {
    lively.warn('should toggle binary Preferences');
  }

  onUpDown(evt) {
    this.selectUpOrDown(evt, -1);
  }

  onDownDown(evt) {
    this.selectUpOrDown(evt, 1);
  }

  onEscDown(evt) {
    // #TODO: check if we are in a submenu
    if (this.parentMenu) {
      this.parentMenu.onEscDown(evt);
    }
    this.remove();
  }

  selectUpOrDown(evt, offset = 0) {
    if (!this.currentItem) {
      this.selectItem(this.items[0]);
    } else {
      var matchingItems = this.matchingItems;
      var targetIndex = (matchingItems.indexOf(this.currentItem) + offset + matchingItems.length) % matchingItems.length; //cycling through menu items
      this.selectItem(matchingItems[targetIndex]);
    }
  }

  onLeftDown(evt) {
    if (this.parentMenu) {
      lively.focusWithoutScroll(this.parentMenu);
      this.parentMenu.selectUpOrDown(evt);
    }
  }

  async onRightDown(evt) {
    if (!this.currentItem) {
      return;
    }

    var entry = this.currentItem.entry;

    if ((await entry.children) instanceof Array) {
      this.enterSubmenu(evt);
    }
  }

  onTabDown(evt) {
    if (evt.shiftKey) {
      this.onLeftDown(evt);
    } else {
      this.onRightDown(evt);
    }
  }

  enterSubmenu(evt) {
    lively.focusWithoutScroll(this.submenu);
    this.submenu.selectUpOrDown(evt);
  }

  async onEnterUp(evt) {
    if (!this.currentItem) return;

    var entry = this.currentItem.entry;
    if (entry.callback) {
      entry.callback(evt, this.currentItem);
    } else if ((await entry.children) instanceof Array) {
      this.enterSubmenu(evt);
    }
  }

  async openOn(items, optEvt, optPos) {
    var container = this.get(".container");
    container.innerHTML = ""; // clear
    // create a radio button for each tool
    if (!items) {
      console.log("WARNING: no items to open");
      return Promise.resolve();
    }
    for (let ea of items) {
      const entry = Entry.fromDescription(ea);
      const item = entry.asItem(this);
      container.appendChild(item);
    }
    if (optPos) lively.setPosition(this, optPos);
    this.moveInsideWindow();

    return Promise.resolve(container);
  }

  async selectItem(item) {
    if (this.currentItem) {
      this.currentItem.classList.remove("current");
      this.currentItem.entry.deselected();
    }
    if (!item) return;

    item.classList.add("current");
    this.currentItem = item;

    // scroll item into view
    item.setAttribute('tabindex', 0);
    item.focus();

    var ea = item.entry;
    var menu = this.get(".container");
    if (this.submenu) this.submenu.remove();
    item.entry.selected();
    const subitems = await ea.children; // resolve Promise
    if (subitems instanceof Array) {
      this.submenu = document.createElement("lively-menu");
      this.submenu.parentMenu = this;
      await lively.components.openIn(menu, this.submenu);
      var bounds = item.getBoundingClientRect();
      var menuBounds = menu.getBoundingClientRect();
      this.submenu.openOn(subitems, null, pt(bounds.right, bounds.top).subPt(pt(menuBounds.left, menuBounds.top
      // lively.moveBy(this, delta)
      )));
    }
  }

}