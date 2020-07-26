/*MD
  ![](https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/screenshots/titlebar.png){width=500px}
MD*/

"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

const DEFAULT_NAME = 'New Cell';
const UNNAMED = 'Unnamed Cell';
const DEFAULT_BG_COLOR = '#778899';
const HIGHLIGHT_BG_COLOR = 'cornflowerblue';

export default class LivelySimulationTitlebar extends Morph {
  
  // life cycle
  initialize() {
    this.initializeDelete();
    this.initializeMenu();
    this.initializeDragDrop();
    this.initializeViewSwitch();
    this.initializeName();
    this.initializeLocate();
  }
  
  initializeName(name = DEFAULT_NAME) {
    const cell = this.getCell();
    const cellNameInput = this.get('#cellName');
    this.setName(name);
    if (cell && cell.isMirrorCell()) {
      cellNameInput.setAttribute('disabled', true);
    } else {
      cellNameInput.addEventListener('focusout', () => this.handleCellNameInputFocusOut());
    }
  }
  
  initializeViewSwitch() {
    _.forEach(['code', 'log', 'chart'], view => 
              this.get(`#${view}`).addEventListener('click', () => {
      const cell = this.getCell();
      if (!cell.switchViewTo) return;
      cell.switchViewTo(`${view}View`);
    }));
  }
  
  initializeMenu() {
    const menuIcon = this.get('#menu');
    menuIcon.addEventListener('click', () => this.handleMenuClick());
  }
  
  initializeLocate() {
    const locateIcon = this.get('#locate');
    locateIcon.addEventListener('click', () => this.handleLocateClick());
  }
  
  initializeDelete() {
    const deleteIcon = this.get('#delete');
    deleteIcon.addEventListener('click', () => this.handleDelete());
  }
  
  initializeDragDrop() {
    this.get('#titleBar').addEventListener('pointerdown', event => {
      const cell = this.getCell();
      if (!cell || !cell.startGrabbing) return;
      cell.startGrabbing(event, false)
    });
  }
  
  // event handler
  handleCellNameInputFocusOut() {
    const simulation = this.getCell().getSimulation();
    if (!simulation.ensureUniqueCellName) return;
    let cellNameProposal = this.getName().length ? this.getName() : UNNAMED;
    if (!cellNameProposal.match(/^[a-zA-Z]/)) cellNameProposal = `Cell ${cellNameProposal}`;
    this.setName(simulation.ensureUniqueCellName(cellNameProposal));
  }
  
  handleDelete() {
    const cell = this.getCell();
    const shouldDelete = confirm(`Delete ${this.getName()}`);
    if (shouldDelete && cell.delete) cell.delete();
  }
  
  handleMenuClick() {
    if (this.menu) {
      this.menu.remove();
      delete this.menu;
    } else
      this.openMenu();
  }
  
  handleLocateClick() {
    const cell = this.getCell();
    if (!cell.getNormalizedName || !cell.getSimulation) return;
    const cellRef = cell.getNormalizedName().toLowerCase();
    const simulation = cell.getSimulation();
    if (!simulation.toggleHighlight) return;
    simulation.toggleHighlight(cellRef);
  }

  // other
  openMenu() {
    const cell = this.getCell();
    const menuIcon = this.get('#menu');
    return Promise.resolve(lively.create('lively-menu'))
      .then(livelyMenu => {
        this.menu = livelyMenu;
        livelyMenu.openOn(menu(
          (event) => cell.clone(event), 
          cell.shouldSkip, 
          () => cell.toggleSkip(), 
          () => cell.executeSelf(),
          (event) => cell.mirror(event)));
        this.shadowRoot.appendChild(livelyMenu);
        livelyMenu.style.top = `${menuIcon.offsetHeight}px`;
        setTimeout(() => livelyMenu.addEventListener('click', () => this.handleMenuClick()), 0);
    });
  }
  
  getNormalizedName() {
    return this.camelize(this.toAlphaNumeric(this.getName()));
  }
  
  getName() {
    return this.get('#cellName').value.trim();
  }
  
  setName(name) {
    this.get('#cellName').value = name;
  }
  
  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }
  
  camelize(str) {
    // https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
      if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }

  toAlphaNumeric(str) {
    return str.replace(/\W/g, '');
  }
  
  isFocused() {
    return this.isChildFocused(this.get('#cellName'));
  }
  
  isChildFocused(child, doc = document) {
    if (doc.activeElement === child) return true;
    if (doc.activeElement && doc.activeElement.shadowRoot)
			return this.isChildFocused(child, doc.activeElement.shadowRoot)
    return false;
  }
  
  getCell() {
    return this.getRootNode().host;
  }
  
  highlight(highlight) {
    this.get('#titleBar').style.backgroundColor = highlight ? HIGHLIGHT_BG_COLOR : DEFAULT_BG_COLOR;
  }
}

const menu = (clone, shouldSkip, toggleSkip, execute, mirror) => [
  [
    "Clone",
    event => clone && clone(event),
    "",
    '<i class="fa fa-clone"></i>'
  ],
  [
    shouldSkip ? 'Enable' : 'Skip',
    () => toggleSkip && toggleSkip(),
    "",
    shouldSkip ? '<i class="fa fa-play"></i>' : '<i class="fa fa-forward"></i>'
  ],
  [
    'Execute',
    () => execute && execute(),
    "",
    '<i class="fa fa-cogs"></i>'
  ],
  [
    'Mirror',
    event => mirror && mirror(event),
    "",
    '<i class="fa fa-anchor"></i>'
  ]
]