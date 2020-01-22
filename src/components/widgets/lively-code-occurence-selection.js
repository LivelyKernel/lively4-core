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
    this.htmlAccessorList.innerHTML = "";
  }

  async selectItems(items) {
    this.items = items;
    for (let { id } of items) {
      let item = document.createElement("tr");
      /*let lineAndColumn = {
        line: ea.line, 
        column: ea.column,
        selection: ea.selection }
      */
      item.innerHTML = `<td class="accesssorName">
          <input type="checkbox" value="${id}">
          ${id}
        </td>`;
      item.addEventListener("click", event => {
        this.selectItem(event.target);
      });
      this.htmlAccessorList.appendChild(item);
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
  
  gatherCheckedIds() {
    return this.htmlAccessorList.querySelectorAll("input").filter(element => element.checked).map(element => this.items.find(item => item.id === element.value));
  }

  get htmlAccessorList() {
    return this.get("#CodeOccurencesList");
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