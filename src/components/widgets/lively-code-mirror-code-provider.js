import { loc, range, fileEnding, replaceFileEndingWith } from 'utils';

export default class CodeMirrorCodeProvider {
  
  constructor(livelyCodeMirror, codeMirror) {
    this.codeMirror = codeMirror;
    this.livelyCodeMirror = livelyCodeMirror;
  }
  
  get code() {
    return this.livelyCodeMirror.value;
  }
  
  set code(text) {
    this.livelyCodeMirror.value = text;
    this.livelyCodeMirror.focus();
  }
  
  get cursor() {
    return loc(this.codeMirror.getCursor());
  }
  
  set cursor(location) {
    this.selections = [range([location, location])]
  }

  get selections() {
    return this.codeMirror.listSelections().map(range);
  }  
  
  /** 
   * Select the text corresponding to the given nodes in the editor
   */
  set selections(ranges) {
    const selections = ranges.map(range => {
      return {anchor: range.asCM()[0], head: range.asCM()[1]};
    });
    // #TODO: include primary selection
    if (selections.length == 1) {
      this.codeMirror.setSelection(selections[0].anchor, selections[0].head);
    } else {
      this.codeMirror.setSelections(selections);
    }
    this.codeMirror.scrollIntoView({ from: selections[0].anchor, to: selections[0].head }, 120);
  }
  
  

  get scrollInfo() {
    return this.codeMirror.getScrollInfo();
  }
  
  set scrollInfo(scrollInfo) {
    this.codeMirror.scrollIntoView({
      left: scrollInfo.left,
      top: scrollInfo.top,
      right: scrollInfo.left + scrollInfo.width,
      bottom: scrollInfo.top + scrollInfo.height
    }, 120);
  }
  
  get htmlURI() {
    let editor = lively.allParents(this.livelyCodeMirror, undefined, true).find(ele => ele.tagName && ele.tagName === 'LIVELY-EDITOR');
    let jsURI = encodeURI(editor.shadowRoot.querySelector("#filename").value);
    return jsURI::replaceFileEndingWith('html');
  }

}