import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from "src/client/fileindex.js";
import _ from 'src/external/lodash/lodash.js';

export default class HTMLAccessorMenu extends Morph {
  initialize() {
    this.registerButtons();
  }

  setTitle(title) {
    this.windowTitle = title;
  }

  focus() {
    //this.get("#searchInput").focus();
  }
  clearLog(s) {
    this.codeOccurencesList.innerHTML = "";
  }

  async selectItems(items, initialSelectionState) {
    this.items = items;
    if (!initialSelectionState) {
      initialSelectionState = items.map(elem => false);
    }
    initialSelectionState = initialSelectionState.map(elem => elem ? " checked disabled" : "");
    let index = 0;
    for (let { id } of items) {
      let item = document.createElement("tr");
      /*let lineAndColumn = {
        line: ea.line, 
        column: ea.column,
        selection: ea.selection }
      */
      item.innerHTML = `<td class="accesssorName">
          <input type="checkbox" value="${id}"${initialSelectionState[index++]}>
          ${id}
        </td>`;
      item.addEventListener("click", event => {
        this.selectItem(event.target);
      });
      this.codeOccurencesList.appendChild(item);
    }
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
    });
  }

  async showSearchResult(url, lineAndColumn) {
    var editor = this.get("#editor");

    editor.setURL(url);
    await editor.loadFile();

    var codeMirror = await editor.awaitEditor();
    codeMirror.setSelection({ line: lineAndColumn.line, ch: lineAndColumn.column }, { line: lineAndColumn.line, ch: lineAndColumn.column + (lineAndColumn.selection ? +lineAndColumn.selection.length : 0) });
    codeMirror.focus();
    codeMirror.scrollIntoView(codeMirror.getCursor(), 250);
  }

  selectItem(item) {
    const selectedElement = item.value || item.children[0].value;
    const selectedItem = this.items.find(item => item.id === selectedElement);
    this.showSearchResult(selectedItem.url, { line: selectedItem.line, column: selectedItem.ch });
  }

  get codeOccurencesList() {
    return this.get("#CodeOccurencesList");
  }

  gatherCheckedIds() {
    return this.codeOccurencesList.querySelectorAll("input").filter(element => element.checked && !element.disabled).map(element => this.items.find(item => item.id === element.value));
  }

  onOkButton() {
    let selectedIds = this.gatherCheckedIds();
    this.resolve(selectedIds);
    this.parentElement.remove();
  }

  onCancelButton() {
    this.resolve([]);
    this.parentElement.remove();
  }

  browseSearchResult(url, pattern) {
    return lively.openBrowser(url, true, pattern, undefined);
  }
}