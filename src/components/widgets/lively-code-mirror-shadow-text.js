
import Preferences from 'src/client/preferences.js';
import OpenAI from "demos/openai/openai.js";
import Morph from "src/components/widgets/lively-morph.js";

import { hasCleanRight } from 'src/client/utils/code-mirror-utils.js';

self.__currentShadowText__ = undefined;

let modifyShadowItself = false
function preventTriggeringShadow(callback) {
  try {
    modifyShadowItself = true
    return callback()
  } finally {
    modifyShadowItself = false
  }
}

class ShadowText {
  
  constructor(lcm, cm) {
    this.lcm = lcm;
    this.cm = cm;
    
    OpenAICompletion.clearCurrentShadowText()
    self.__currentShadowText__ = this;

    this.main()
  }

  /*MD ## Helpers MD*/
  isActive() {
    return self.__currentShadowText__ === this;
  }

  get icon() {
    return this.lcm::Morph.prototype.getSubmorph('#openai-hint-icon');
  }

  get iconText() {
    return this.lcm::Morph.prototype.getSubmorph('#openai-hint-text');
  }
  

  
  /*MD ## Generation MD*/
  async main() {
    const icon = this.icon;
    this.iconText.innerHTML = ""
    icon.className = 'fa fa-circle-o-notch fa-pulse fa-fw'
    await lively.sleep(1000)
    if (!this.isActive()) {
      return
    }
    if (this.cm.state.completionActive) {
      return;
    }
    var start = performance.now()
    icon.className = 'fa fa-spinner fa-pulse fa-fw'
    const result = await this.getCompletion()
    if (!this.isActive()) {
      return
    }
    if (this.cm.state.completionActive) {
      return;
    }
    
    if (result.isError) {
      lively.error(result.error, 'Error during OpenAI Completion')
      debugger
      this.clear()
      return;
    }

    const text = result.completion;
    this.showShadow(text)
    var time = performance.now() - start
    this.iconText.innerHTML = "(" + Math.round(time) + "ms)"
  
  }
  
  async getCompletion() {
    const doc = this.cm;
    if (doc.somethingSelected()) {
      return;
    }
    const cursorPos = doc.getCursor();
    const index = doc.indexFromPos(cursorPos)
    const allCode = doc.getValue()
    const code = allCode.substring(Math.max(0, index-500), index)

    const result = await OpenAI.completeCode(code)
    // const result = (await lively.sleep(Math.random().remap([0,1],[1000,3000])), {
    //   completion: 'hello.world'
    // })
    
    return result
  }
  
  showShadow(text) {
    
    this.icon.className = 'fa fa-indent'

    preventTriggeringShadow(() => {
      const { lcm, cm } = this;
      const cursorPos = cm.getCursor();

      lively.success(text)

      cm.replaceRange(text, cursorPos, cursorPos)
      // cm.setCursor(cursorPos);
      
      this.marker = cm.markText(cursorPos, cm.posFromIndex(cm.indexFromPos(cursorPos) + text.length), {
        className: 'string',
        inclusiveLeft: false,
        inclusiveRight: false,
        selectLeft: true,
        selectRight: true,
        collapsed: false,
        clearOnEnter: false,
        clearWhenEmpty: false,
        // replacedWith: Element,
        // handleMouseEvents: boolean,
        // readOnly: false,
        // addToHistory: true,
        startStyle: 'outline: 3px solid red;',
        endStyle: 'outline: 3px solid red;',
        css: "background-color: rgba(0,0,0,0.005); color: #bbb;",
        attributes: {},
        shared: false,
      })
    })
  }
  
  hasCompletion() {
    return !!this.marker
  }

  /*MD ## Shadow Text MD*/
  // #important
  accept() {
    // lively.notify('accept shadow')
    preventTriggeringShadow(() => {
      const { to } = this.marker.find()
      this.marker.clear()
      this.marker = undefined
      this.clear()
      this.cm.setCursor(to)
    })
    
    this.icon.className = ''
  }
  
  clear() {
    // lively.notify('clear shadow')
    if (this.marker) {
      preventTriggeringShadow(() => {
        const { from, to } = this.marker.find()
        this.cm.replaceRange('', from, to)
        this.marker.clear()
      })
    }
    
    this.icon.className = ''
    
    self.__currentShadowText__ = undefined;
  }
  
}

/*MD ## Gpt Anbindung
- [x] Only in focussed codemirror
- [x] Only if lang is js
- [x] Use marker
- [x] Store it globally
- [x] Remove existing marker, when making a new one
- [x] Remove when losing focus
- [x] Remove when removed from dom
- [x] Remove on other keys pressed except TAB
- [x] Do not create while in multiselect or non-collapsed selections
- [x] Debounce on text change/cursor activity?
- [ ] undo history
- [x] crtl-space window
- [x] tab is still inserted
- [x] only on clean right
MD*/
class OpenAICompletion {

  constructor(lcm, cm) {
    this.lcm = lcm;
    this.cm = cm;
  }
  
  // #important
  requestShadowText() {
    OpenAICompletion.clearCurrentShadowText()
    
    const { lcm, cm } = this;
    
    if (!Preferences.get('AIShadowText')) {
      return;
    }
    
    if (!lcm.matches(':focus')) {
      // cm.hasFocus()
      return;
    }
    
    if (modifyShadowItself) {
      return
    }

    if (cm.somethingSelected()) {
      return;
    }
    
    if (cm.listSelections().length > 1) {
      return;
    }
    
    if (!cm::hasCleanRight(cm.getCursor())) {
      return;
    }
    
    const completableTextType = lcm.isJavaScript || lcm.isMarkdown || lcm.isHTML
    if (!completableTextType) {
      return;
    }
    
    new ShadowText(lcm, cm)
  }

  // #important
  static clearCurrentShadowText() {
    if (!self.__currentShadowText__) {
      return
    }

    if (modifyShadowItself) {
      return
    }
    
    self.__currentShadowText__.clear()
  }

  /*MD ## request shadow text MD*/
  handleContentChange(cm, changes) {
    // lively.warn('ContentChange')
    this.requestShadowText()
  }
  handleCursorActivity(cm) {
    // lively.warn('CursorActivity')
    this.requestShadowText()
  }
  handleEditorFocus(cm, evt) {
    // lively.warn('EditorFocus')
    this.requestShadowText()
  }
  
  /*MD ## clear shadow text MD*/
  handleEditorBlur(cm, evt) {
    // lively.warn('EditorBlur')
    OpenAICompletion.clearCurrentShadowText()
  }
  handleDetachedCM() {
    // lively.warn('DetachedCM')
    OpenAICompletion.clearCurrentShadowText()
  }

  /*MD ## accept/reject shadow text MD*/
  handleKeyEvent(cm, evt) {
    // lively.warn('KeyEvent')
    if (!self.__currentShadowText__?.hasCompletion?.()) {
      return
    }

    if (evt.key === 'Tab' && !evt.altKey && !evt.ctrlKey && !evt.shiftKey) {
      
      evt.preventDefault();
      evt.stopPropagation();
      evt.codemirrorIgnore = true;
      self.__currentShadowText__.accept()
      return false;
    } else {
      OpenAICompletion.clearCurrentShadowText()
    }
  }

}


self.__CodeMirrorShadowText__ = function __CodeMirrorShadowText__(lcm, cm) {
  return new OpenAICompletion(lcm, cm);
};
