import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from "src/client/fileindex.js";
import _ from 'src/external/lodash/lodash.js';

export default class HTMLAccessorMenu extends Morph {
  initialize() {
    this.windowTitle = "HTML Accessor Menu";
    this.registerButtons();
  }

  focus() {
    //this.get("#searchInput").focus();
  }
  clearLog(s) {
    this.get("#HTMLAccessorList").innerHTML = "";
  }

  async selectHTMLIds(ids) {
    this.ids = ids;
    for (let id of ids) {
      let item = document.createElement("tr");
      /*let lineAndColumn = {
        line: ea.line, 
        column: ea.column,
        selection: ea.selection }
      */
      item.innerHTML = `<td class="accesssorName"><input type="checkbox" value="${id}">
  ${id}</td>`;
      this.get("#HTMLAccessorList").appendChild(item);
    }
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
    });
  }

  gatherCheckedIds() {
    let accessor = this.get("#HTMLAccessorList");
    return accessor.querySelectorAll("input").filter(element => element.checked).map(element => element.value);
  }

  onOkButton() {
    lively.warn("ok");
    this.resolve(this.gatherCheckedIds());
    this.remove();
  }

  onCancelButton() {
    lively.warn("cancel");
    this.resolve([]);
    this.remove();
  }

  async showSearchResult(url, lineAndColumn) {
    var editor = this.get("#editor"

    // unhide editor, when it is needed
    );if (editor.style.flexGrow < 0.01) {
      // #Hack
      this.get("lively-separator").toggleCollapse();
    }

    editor.setURL(url);
    await editor.loadFile();

    var codeMirror = await editor.awaitEditor();
    codeMirror.setSelection({ line: lineAndColumn.line, ch: lineAndColumn.column }, { line: lineAndColumn.line, ch: lineAndColumn.column + (lineAndColumn.selection ? +lineAndColumn.selection.length : 0) });
    codeMirror.focus();
    codeMirror.scrollIntoView(codeMirror.getCursor(), 200);
  }

  browseSearchResult(url, pattern) {
    return lively.openBrowser(url, true, pattern, undefined /* lively.findWorldContext(this)*/);
  }

  onSearchResults(list, search) {
    list = _.sortBy(list, ea => ea.url);
    let lastPrefix;
    for (var ea of list) {
      let pattern = ea.text;
      let url = ea.url;
      let item = document.createElement("tr");
      let filename = ea.file.replace(/.*\//, "");
      let dirAndFilename = ea.url.replace(/.*\/([^/]+\/[^/]+$)/, "$1");
      let prefix = url.replace(dirAndFilename, "");
      if (lastPrefix != prefix) {
        this.get("#HTMLAccessorList").appendChild(<tr class="prefix"><td colspan="3">{prefix}</td></tr>);
      }
      lastPrefix = prefix;
      let path = ea.url.replace(this.serverURL(), "");
      let lineAndColumn = {
        line: ea.line,
        column: ea.column,
        selection: ea.selection };

      item.innerHTML = `<td class="filename"><a>${dirAndFilename}</a></td>
        <td class="line">${ea.line + 1}:</td>
        <td><span ="pattern">${pattern.replace(/</g, "&lt;").replace(new RegExp("(" + search + ")"), "<b>$1</b>")}</span></td>`;
      let link = item.querySelector("a");
      link.href = ea.file;
      link.url = url;
      link.title = ea.file;
      var self = this;
      link.onclick = evt => {
        if (evt.shiftKey || evt.ctrlKey) {
          this.browseSearchResult(url, lineAndColumn);
        } else {
          this.showSearchResult(url, lineAndColumn);
        }
        return false;
      };
      this.get("#HTMLAccessorList").appendChild(item);
    }
  }
}