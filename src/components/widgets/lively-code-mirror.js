/*MD 
# CodeMirror

Workspace / main source code editing component. 

Keywords: #Tool #Widget #Core #Lively4 #Workspace #Important

Authors: @JensLincke @CodeMirrorProject 



![](lively-code-mirror.png){height=200}

MD*/

import { promisedEvent, through, uuid as generateUUID } from 'utils';
import boundEval from 'src/client/bound-eval.js';
import Morph from "src/components/widgets/lively-morph.js";
import SyntaxChecker from 'src/client/syntax.js';
import { debounce } from "utils";
import Preferences from 'src/client/preferences.js';
import { pt } from 'src/client/graphics.js';
import 'src/client/stablefocus.js';
import Strings from 'src/client/strings.js';
import { letsScript } from 'src/client/vivide/vivide.js';
// import LivelyCodeMirrorWidgetImport from 'src/components/widgets/lively-code-mirror-widget-import.js';
import openMenu from 'src/components/widgets/lively-code-mirror-context-menu.js';
import * as spellCheck from "src/external/codemirror-spellcheck.js";
import { isSet } from 'utils';
import fake from "./lively-code-mirror-fake.js";
import CodeMirror from "src/external/code-mirror/lib/codemirror.js";
self.CodeMirror = CodeMirror; // for modules
self.__codeMirrorLoadingPromise__ = self.__codeMirrorLoadingPromise__ || undefined;
import indentationWidth from 'src/components/widgets/indent.js';
import AEGutter from 'src/client/reactive/components/basic/AEGutter.js';

import LivelyCodeMirrorCodeProvider from 'src/components/widgets/lively-code-mirror-code-provider.js';
import 'src/components/widgets/ast-capabilities.js';
import 'src/components/widgets/lively-code-mirror-modes.js';
import 'src/components/widgets/lively-code-mirror-shadow-text.js';

import _ from 'src/external/lodash/lodash.js';

export function stripErrorString(s) {
  return s.toString().replace(/Error: workspace(js)?:[^:]*:/, "Error:").replace(/\n {2}Evaluating workspace(js)?:.*/, "").replace(/\n {2}Loading workspace(js)?:.*/, "").replace(/\n {2}Instantiating workspace(js)?:.*/, "");
}

function posEq(a, b) {
  return a.line == b.line && a.ch == b.ch;
}

export default class LivelyCodeMirror extends HTMLElement {

  fake(...args) {
    fake(this.editor, ...args);
  }

  get mode() {
    return this.getAttribute('mode');
  }
  set mode(val) {
    return this.setAttribute('mode', val);
  }

  static get codeMirrorPath() {
    return lively4url + "/src/external/code-mirror/";
  }

  static async loadModule(path, force) {
    if (!self.CodeMirror) {
      console.warn("CodeMirror is missing, could not initialize " + path);
      return;
    }
    var code = await fetch(this.codeMirrorPath + path).then(r => r.text());
    try {
      // AdHoc fix broken UMD dependencies in code mirror modules... alternative: make dependency to "../../lib/codemirror" work
      var originalDefine = globalThis.define
      try {
        delete globalThis.define
        eval(code);
      }  finally {
        globalThis.define = originalDefine
      }
    } catch (e) {
      console.error("Could not load CodeMirror module " + path, e);
    }
    // return lively.loadJavaScriptThroughDOM("codemirror_"+path.replace(/[^A-Za-z]/g,""),
    //   this.codeMirrorPath + path, force)
  }

  static async loadCSS(path) {
    return lively.loadCSSThroughDOM("codemirror_" + path.replace(/[^A-Za-z]/g, ""), this.codeMirrorPath + path);
  }

  static async loadModules(force) {
    // console.log("loadModules", self.__codeMirrorLoadingPromise__);
    if (self.__codeMirrorLoadingPromise__ && !force) return self.__codeMirrorLoadingPromise__;
    self.__codeMirrorLoadingPromise__ = (async () => {

      await this.loadModule("addon/fold/foldcode.js");

      await this.loadModule("mode/javascript/javascript.js");
      await this.loadModule("mode/xml/xml.js");
      await this.loadModule("mode/css/css.js");
      await this.loadModule("mode/diff/diff.js");

      await this.loadModule("mode/meta.js");
      await this.loadModule("mode/markdown/markdown.js");
      await this.loadModule("mode/htmlmixed/htmlmixed.js");
      await this.loadModule("addon/mode/overlay.js");
      await this.loadModule("mode/gfm/gfm.js");
      await this.loadModule("mode/stex/stex.js");
      await this.loadModule("mode/jsx/jsx.js");
      await this.loadModule("mode/python/python.js");
      await this.loadModule("mode/clike/clike.js");
      await this.loadModule("mode/shell/shell.js");
      
      await this.loadModule("addon/edit/matchbrackets.js");
      await this.loadModule("addon/edit/closetag.js");
      await this.loadModule("addon/edit/closebrackets.js");
      await this.loadModule("addon/edit/continuelist.js");
      await this.loadModule("addon/edit/matchtags.js");
      await this.loadModule("addon/edit/trailingspace.js");
      await this.loadModule("addon/hint/show-hint.js");
      // await this.loadModule("addon/hint/javascript-hint.js");
      await this.loadModule("addon/search/searchcursor.js");
      await this.loadModule("addon/search/search.js");
      await this.loadModule("addon/search/jump-to-line.js");
      await this.loadModule("addon/search/matchesonscrollbar.js");
      await this.loadModule("addon/search/match-highlighter.js");
      await this.loadModule("addon/scroll/annotatescrollbar.js");
      await this.loadModule("addon/comment/comment.js");
      await this.loadModule("addon/dialog/dialog.js");
      await this.loadModule("addon/scroll/simplescrollbars.js");
      await this.loadModule("addon/display/autorefresh.js");
            
      await this.loadModule("addon/lint/lint.js");
      await this.loadModule("addon/lint/javascript-lint.js");
      await this.loadModule("addon/lint/html-lint.js");
      
      await System.import(lively4url + '/src/external/eslint/eslint-lint.js');
      
      
      await this.loadModule("addon/merge/merge.js");
      await this.loadModule("addon/selection/mark-selection.js");
      await this.loadModule("keymap/sublime.js");
      await System.import(lively4url + '/src/components/widgets/lively-code-mirror-hint.js');
      await System.import(lively4url + '/src/components/widgets/lively-code-mirror-lint.js');

      this.loadCSS("addon/hint/show-hint.css");
      this.loadCSS("addon/lint/lint.css");
      lively.loadCSSThroughDOM("CodeMirrorCSS", lively4url + "/src/components/widgets/lively-code-mirror.css");
      self.__modulesAreLoaded__ = true
    })();
    return self.__codeMirrorLoadingPromise__;
  }

  get astCapabilities() {
    if (!this.myASTCapabilities || !(this.myASTCapabilities instanceof self.__ASTCapabilities__
)) {
      const codeProvider = new LivelyCodeMirrorCodeProvider(this, this.editor);
      this.myASTCapabilities = new self.__ASTCapabilities__
(codeProvider);
    }

    return this.myASTCapabilities;
  }

  get ternWrapper() {
    return System.import('src/components/widgets/tern-wrapper.js').then(m => {
      this.ternLoaded = true;
      return m.TernCodeMirrorWrapper;
    });
  }

  initialize() {
    this._attrObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type == "attributes") {
          // console.log("observation", mutation.attributeName,mutation.target.getAttribute(mutation.attributeName));
          this.attributeChangedCallback(mutation.attributeName, mutation.oldValue, mutation.target.getAttribute(mutation.attributeName));
        }
      });
    });
    this._attrObserver.observe(this, { attributes: true });
    
    this.addEventListener("keydown", evt => this.onKeyDown(evt))
    this.addEventListener("pointerup", evt => this.onPointerUp(evt))
  }
  
  onKeyDown(evt) {
    if ((evt.ctrlKey || evt.metaKey) && evt.key === "c") {
      this.ensureTextContent() // widgets might have a word here..
    }
    
  }
  
  onPointerUp(evt) {
    // keyboard is running out.. so go for the mouse
    // just a test if this is usefull... TODO make it customizable
    if (evt.button === 3) {
      this.editor.replaceSelection("“")
    } else if (evt.button === 4) {
      this.editor.replaceSelection("”")
    }
  }

  applyAttribute(attr) {
    var value = this.getAttribute(attr);
    if (value !== undefined) {
      this.setAttribute(attr, value);
    }
  }
  connectedCallback() {
    if (this.isLoading || this.editor) return;
    this.isLoading = true;
    if ( self.__modulesAreLoaded__) {
      this._connectedCallback()
    } else {
      LivelyCodeMirror.loadModules().then(() => this._connectedCallback())
    }
  }
  
  
  _connectedCallback() {
    this.root = this.shadowRoot; // used in code mirror to find current element

    if (this.textContent) {
      var value = this.decodeHTML(this.textContent);
    } else {
      value = this.value || "";
    }
    this.editView(value);
    this.isLoading = false;
    // console.log("[editor] #dispatch editor-loaded")
    var event = new CustomEvent("editor-loaded");
    // event.stopPropagation();
    this.dispatchEvent(event);
    this["editor-loaded"] = true; // event can sometimes already be fired

    lively.sleep(0).then(() => {
      this.editor.refresh();
      this.updateAExprDependencies();      
    })
  }

  async editorLoaded() {
    if (!this["editor-loaded"]) {
      return promisedEvent(this, "editor-loaded");
    }
  }

  editView(value) {
    if (!value) value = this.value || "";
    var container = this.shadowRoot.querySelector("#code-mirror-container");
    container.innerHTML = "";
    this.setEditor(CodeMirror(container, {
      value: value,
      lineNumbers: true,
      gutters: ["leftgutter", "CodeMirror-linenumbers", "rightgutter", "CodeMirror-lint-markers"],
      lint: true
    }));

    //load astCapabilities
    this.astCapabilities;
  }

  setEditor(editor) {
    this.editor = editor;
    this.setupEditor();
  }

  setupEditor() {
    var editor = this.editor;
    if (this.mode) {
      editor.setOption("mode", this.mode);
    }
    this.setupEditorOptions(editor
    // edit addons
    // editor.setOption("showTrailingSpace", true)
    // editor.setOption("matchTags", true)

    );
    editor.on("change", (doc, evt) => this.dispatchEvent(new CustomEvent("change", { detail: evt })));
    editor.on("change", (() => this.checkSyntax()).debounce(500));
    editor.on("change", (() => this.astCapabilities.codeChanged()).debounce(200));
    
    editor.on("changes", (cm, changes) => this.shadowText.handleContentChange(cm, changes));
    editor.on("focus", (cm, evt) => this.shadowText.handleEditorFocus(cm, evt));
    editor.on("blur", (cm, evt) => this.shadowText.handleEditorBlur(cm, evt));
    
    editor.on("cursorActivity", (() => this.onCursorActivity()).debounce(500));
    editor.on("cursorActivity", cm => this.shadowText.handleCursorActivity(cm));
    editor.on("cursorActivity", (doc, evt) => {
      this.dispatchEvent(new CustomEvent("cursorActivity", { detail: evt }))
    });

    // apply attributes
    _.map(this.attributes, ea => ea.name).forEach(ea => this.applyAttribute(ea));

    // if(Preferences.get('UseTernInCodeMirror')) {
    //   this.enableTern();
    // }
    editor.on("keydown", (...args) => this.keyEvent(...args));
  }

  keyEvent(cm, evt) {
    this.shadowText.handleKeyEvent(cm, evt);
    return self.__CodeMirrorModes__(this, cm).handleKeyEvent(evt);
  }

  get shadowText() {
    return __CodeMirrorShadowText__(this, this.editor)
  }

  clearHistory() {
    var cm = this.editor;
    cm.getDoc().clearHistory();
  }

  addKeys(keymap) {
    var keys = this.ensureExtraKeys();
    this.extraKeys = Object.assign(keys, keymap);
  }

  ensureExtraKeys() {
    if (!this.extraKeys) {
      const keys = '1234567890qwertyuiopasdf hjk zxcvbnm'.replace(/\s/, '').split('').map(c => c.upperCase());
      //       const defaultASTHandlers = _.fromPairs(keys.flatMap(c => {
      //         return ['Alt-', 'Ctrl-Alt-', 'Shift-Alt-'].map(shortcut => {
      //           const shortcutC = shortcut + c;
      //           const prop = shortcutC.camelCase();

      //           return [shortcutC, cm => {
      //             this.astCapabilities(cm).then(ac => {
      //               if (ac[prop]) {
      //                 ac[prop]();
      //               } else {
      //                 lively.notify(shortcutC, 'No Shortcut defined yet.');
      //               }
      //             });
      //           }];
      //         });
      //       }));
      const defaultASTHandlers = {};

      const enterPsychMode = (cm, which, inclusive) => {
        self.__CodeMirrorModes__(this, cm).pushMode('psych', { command: which, inclusive });
      };

      this.extraKeys = Object.assign(defaultASTHandlers, {

        // #KeyboardShortcut Alt-X shortcut for experimental features
        "Alt-X": cm => this.astCapabilities.braveNewWorld(),


        // #KeyboardShortcut Alt-Enter enter 'command' mode
        "Alt-Enter": cm => self.__CodeMirrorModes__(this, cm).pushMode('command'),
        // #KeyboardShortcut Alt-I Inline variable
        "Alt-I": cm => {
          this.astCapabilities.inlineLocalVariable();
        },

        // #KeyboardShortcut Alt-E Extract Expression into a local variable
        "Alt-E": cm => {
          this.astCapabilities.extractExpressionIntoLocalVariable();
        },
        // #KeyboardShortcut Alt-R Rename this identifier
        "Alt-R": cm => {
          this.astCapabilities.rename();
        },
        // #KeyboardShortcut Alt-T enter 'case' mode
        "Alt-T": cm => self.__CodeMirrorModes__(this, cm).pushMode('case'),

        // #KeyboardShortcut Alt-A Select current list item
        "Alt-A": cm => this.astCapabilities.selectCurrentItem(),
        
        // #KeyboardShortcut Shift-Alt-S slurp backward
        "Shift-Alt-S": cm => this.astCapabilities.slurp(false),
        // #KeyboardShortcut Alt-S slurp forward
        "Alt-S": cm => this.astCapabilities.slurp(true),
        
        // #KeyboardShortcut Alt-D psych within (smart): paste group surrounding mouse position enclosed by brackets, braces, or quotes (exclusive)
        "Alt-D": cm => this.astCapabilities.psychInSmart(false),
        // #KeyboardShortcut Shift-Alt-D psych within (smart): paste group surrounding mouse position enclosed by brackets, braces, or quotes (inclusive)
        "Shift-Alt-D": cm => this.astCapabilities.psychInSmart(true),
        // #KeyboardShortcut Alt-F psych within: paste group surrounding mouse position with (exclusive) <character>
        "Alt-F": cm => enterPsychMode(cm, 'psychIn', false),
        // #KeyboardShortcut Shift-Alt-F psych within: paste group surrounding mouse position with (inclusive) <character>
        "Shift-Alt-F": cm => enterPsychMode(cm, 'psychIn', true),

        // #KeyboardShortcut Ctrl-Alt-C enter 'psych' mode
        "Ctrl-Alt-C": cm => self.__CodeMirrorModes__(this, cm).pushMode('psych'),
        // #KeyboardShortcut Alt-C psych: paste word from mouse position
        "Alt-C": cm => this.astCapabilities.psych(),
        // #KeyboardShortcut Shift-Alt-C psych each: paste word part from mouse position
        "Shift-Alt-C": cm => this.astCapabilities.psychEach(),
        // #KeyboardShortcut Alt-V psych to (exclusive): paste from word on mouse position up to (exclusive) <character>
        "Alt-V": cm => enterPsychMode(cm, 'psychTo', false),
        // #KeyboardShortcut Shift-Alt-V psych to (inclusive): paste from word on mouse position up to (inclusive) <character>
        "Shift-Alt-V": cm => enterPsychMode(cm, 'psychTo', true),
        
        // #KeyboardShortcut Shift-Alt-B barf upward
        "Shift-Alt-B": cm => this.astCapabilities.barf(false),
        // #KeyboardShortcut Alt-B barf downward
        "Alt-B": cm => this.astCapabilities.barf(true),

        // #KeyboardShortcut Alt-N negate an expression
        "Alt-N": cm => this.astCapabilities.negateExpression(),
        // #KeyboardShortcut Alt-U Replace parent node with selection
        "Alt-U": cm => this.astCapabilities.replaceParentWithSelection(),
        // #KeyboardShortcut Alt-O Insert new line below
        "Alt-O": cm => this.astCapabilities.newlineAndIndent(true),
        // #KeyboardShortcut Shift-Alt-O Insert new line above
        "Shift-Alt-O": cm => this.astCapabilities.newlineAndIndent(false),

        // #KeyboardShortcut Alt-/ insert markdown comment
        "Alt-/": cm => this.astCapabilities.insertMarkdownComment(),

        // #KeyboardShortcut Alt-M ast refactoring/autocomplete menu
        "Alt-M": cm => {
          if (this.isJavaScript) {
            this.openContextMenu(cm);
          } else {
            lively.warn("Context Menu doesn't work outside of js files for now!");
          }
        },

        "Insert": cm => {
          // do nothing... the INSERT mode is so often activated by accident 
        },
        "Ctrl-Insert": cm => {
          // INSERT mode is so often activated by accident, require CTRL now 
          cm.toggleOverwrite();
        },
        // #KeyboardShortcut Ctrl-H search and replace
        "Ctrl-H": cm => {
          setTimeout(() => {
            this.editor.execCommand("replace");
            this.shadowRoot.querySelector(".CodeMirror-search-field").focus();
          }, 10);
        },
        // #KeyboardShortcut Ctrl-Space auto complete
        "Ctrl-Space": cm => {
          this.fixHintsPosition();
          cm.execCommand("autocomplete");
        },
        // #KeyboardShortcut Ctrl-Alt-Space auto complete
        "Ctrl-Alt-Space": cm => {
          this.fixHintsPosition();
          cm.execCommand("autocomplete");
        },
        // #KeyboardShortcut Ctrl-P eval and print selection or line
        "Ctrl-P": cm => {
          let text = this.getSelectionOrLine();
          this.tryBoundEval(text, true);
        },
        // #KeyboardShortcut Ctrl-Alt-U complete code snippet using experimental local SWACopilot 
        "Ctrl-Alt-U": cm => {
          let text = this.getSelectionOrLine();
          this.trySWACopilot(text, true);
        },
        // #KeyboardShortcut Ctrl-I eval and inspect selection or line
        "Ctrl-I": cm => {
          let text = this.getSelectionOrLine();
          this.inspectIt(text);
        },
        // #KeyboardShortcut Ctrl-D eval selection or line (do it)
        "Ctrl-D": (cm, b, c) => {
          let text = this.getSelectionOrLine();
          this.tryBoundEval(text, false);
          return true;
        },
        // #HACK we seem to be incapable of dealling automatically with code snippets that contain "await", so lets make it explicit #FutureWork #Research
        // #KeyboardShortcut Shift-Ctrl-D async eval selection or line (do it)
        "Shift-Ctrl-D": (cm, b, c) => {
          let text = this.getSelectionOrLine();
          this.tryBoundEval(";(async () => { " + text + "})()", false);
          return true;
        },
        // #KeyboardShortcut Ctrl-F search
        "Ctrl-F": cm => {
          // something immediately grabs the "focus" and we close the search dialog..
          // #Hack...
          setTimeout(() => {
            this.editor.execCommand("findPersistent");
            var searchField = this.shadowRoot.querySelector(".CodeMirror-search-field");
            if (searchField) {
              // start with the last search..
              if (!searchField.value && this.lastSearch) {
                var oldSearch = searchField.value;
                searchField.value = this.lastSearch;
              } else {
                this.lastSearch = searchField.value; // we got a new search
              }
              lively.addEventListener("lively4", searchField, "input", () => {
                this.lastSearch = searchField.value;
              });
              searchField.focus();
              searchField.select();
            }
          }, 10
          // editor.execCommand("find")
          );
        },

        // #KeyboardShortcut Ctrl-Alt-Right multiselect next
        "Ctrl-Alt-Right": "selectNextOccurrence",
        // #KeyboardShortcut Ctrl-Alt-Left undo multiselect
        "Ctrl-Alt-Left": "undoSelection",

        // #KeyboardShortcut Ctrl-/ indent selection
        "Ctrl-/": "toggleCommentIndented",
        // #KeyboardShortcut Ctrl-# indent selection
        "Ctrl-#": "toggleCommentIndented",
        // #KeyboardShortcut Tab insert tab or soft indent
        'Tab': cm => {
          if (cm.somethingSelected()) {
            cm.indentSelection("add");
          } else {
            cm.execCommand('insertSoftTab');
          }
        },
        // #KeyboardShortcut Ctrl-S save content
        "Ctrl-S": cm => {
          this.doSave(cm.getValue());
        },
        
        // #KeyboardShortcut Ctrl-Alt-V eval and open in vivide
        "Ctrl-Alt-V": async cm => {
          let text = this.getSelectionOrLine();
          let result = await this.tryBoundEval(text, false);
          letsScript(result);
        },
        // #KeyboardShortcut Ctrl-Alt-I show type using tern
        "Ctrl-Alt-I": cm => {
          this.ternWrapper.then(tw => tw.showType(cm, this));
        },
        // #KeyboardShortcut Alt-. jump to definition using tern
        "Alt-.": cm => {
          lively.notify("try to JUMP TO DEFINITION");
          this.ternWrapper.then(tw => tw.jumpToDefinition(cm, this));
        },
        // #KeyboardShortcut Alt-, jump back from definition using tern
        "Alt-,": cm => {
          this.ternWrapper.then(tw => tw.jumpBack(cm, this));
        },
        // #KeyboardShortcut Shift-Alt-. show references using tern
        "Shift-Alt-.": cm => {
          this.ternWrapper.then(tw => tw.showReferences(cm, this));
        },

        /*MD #AST-Navigation MD*/

        // #KeyboardShortcut Alt-Up Expand selection in ast-aware manner
        "Alt-Up": cm => {
          this.astCapabilities.expandSelection(cm);
        },
        // #KeyboardShortcut Alt-Down Reduce selection in ast-aware manner
        "Alt-Down": cm => {
          this.astCapabilities.reduceSelection(cm);
        },
        // #KeyboardShortcut Alt-Shift-Up Select previous like this
        "Shift-Alt-Up": cm => {
          this.astCapabilities.selectNextASTNodeLikeThis(true);
        },
        // #KeyboardShortcut Alt-Shift-Down Select next like this
        "Shift-Alt-Down": cm => {
          this.astCapabilities.selectNextASTNodeLikeThis(false);
        },

        // #KeyboardShortcut Alt-Left Select previous element in ast-aware manner
        "Alt-Left": cm => {
          this.astCapabilities.selectNextASTChild(true);
        },
        // #KeyboardShortcut Alt-Right Select next element in ast-aware manner
        "Alt-Right": cm => {
          this.astCapabilities.selectNextASTChild(false);
        },
        // #KeyboardShortcut Alt-Shift-Left Select previous reference
        "Shift-Alt-Left": cm => {
          this.astCapabilities.selectNextReference(true);
        },
        // #KeyboardShortcut Alt-Shift-Right Select next reference
        "Shift-Alt-Right": cm => {
          this.astCapabilities.selectNextReference(false);
        },

        // #KeyboardShortcut Shift-Alt-U Jump to declaration of this identifier
        "Shift-Alt-U": cm => {
          this.astCapabilities.selectDeclaration();
        },

        // #KeyboardShortcut Alt-Backspace Leave Editor and go to Navigation
        "alt-Backspace": async cm => {
          this.singalEditorbackNavigation();
        },
        // #KeyboardShortcut Shift-Alt-Backspace Leave and Close Editor and go to Navigation
        "shift-alt-Backspace": async cm => {
          this.singalEditorbackNavigation(true);
        },
        // #KeyboardShortcut Shift-Alt-A show additional info of this Active Expression
        "Shift-Alt-A": async cm => {
          this.showAExprDependencyTextMarkers();
        },
        // #Async #Workspace #Snippet #Workaround missing global async/await support in JavaScript / our Workspaces
        "Ctrl-Alt-A": cm => {
          var selection = this.editor.getSelection
          // #TODO how can we have custom snippets?
          ();this.editor.replaceSelection(`var value;
(async () => {
  value = ${selection}
})()`);
          this.editor.execCommand(`goWordLeft`);
          this.editor.execCommand(`goCharLeft`);
        },
        // #KeyboardShortcut Ctrl-Shift-A Update Active Expression Dependencies
        "Ctrl-Shift-A": cm => {
          this.updateAExprDependencies();
        },
        "F4": cm => {},
        "F9": cm => {}

      });
    }

    return this.extraKeys;
  }

  openContextMenu(cm) {
    openMenu(this.astCapabilities, cm, this);
  }

  async singalEditorbackNavigation(closeEditor) {
    var container = lively.query(this, "lively-container");
    if (container) {
      if (closeEditor) await container.onCancel();
      await lively.sleep(10
      // it seems not to bubble across shadow root boundaries #Bug ?
      // so we do it manually, but keep it an event
      );container.dispatchEvent(new CustomEvent("editorbacknavigation", {
        bubbles: true,
        cancelable: true
      }));
    }
  }

  registerExtraKeys(options) {
    if (options) this.addKeys(options);
    var keys = {};
    keys = Object.assign(keys, CodeMirror.keyMap.sublime);
    keys = Object.assign(keys, this.ensureExtraKeys());
    this.editor.setOption("extraKeys", CodeMirror.normalizeKeyMap(keys));
  }

  setupEditorOptions(editor) {
    editor.setOption("matchBrackets", true);
    editor.setOption("styleSelectedText", true);
    editor.setOption("autoCloseBrackets", true);
    editor.setOption("autoCloseTags", true);
    editor.setOption("scrollbarStyle", "simple");
    editor.setOption("scrollbarStyle", "simple");
    
    editor.setOption("autoRefresh",  {delay: 10 });
    

    editor.setOption("tabSize", indentationWidth());
    editor.setOption("indentWithTabs", false);
    editor.setOption("indentUnit", indentationWidth());

    editor.setOption("highlightSelectionMatches", { showToken: /\w/, annotateScrollbar: true

      // editor.setOption("keyMap",  "sublime")

    });editor.on("cursorActivity", cm => {
      if (this.ternLoaded) {
        this.ternWrapper.then(tw => tw.updateArgHints(cm, this));
      }
    });

    // http://bl.ocks.org/jasongrout/5378313#fiddle.js
    editor.on("cursorActivity", cm => {
      // this.ternWrapper.then(tw => tw.updateArgHints(cm, this));
      const widgetEnter = cm.widgetEnter;
      cm.widgetEnter = undefined;
      if (widgetEnter) {
        // check to see if movement is purely navigational, or if it
        // doing something like extending selection
        var cursorHead = cm.getCursor('head');
        var cursorAnchor = cm.getCursor('anchor');
        if (posEq(cursorHead, cursorAnchor)) {
          widgetEnter();
        }
      }
    });
    editor.setOption("hintOptions", {
      container: this.shadowRoot.querySelector("#code-mirror-hints"),
      codemirror: this,
      closeCharacters: /\;/ // we want to keep the hint open when typing spaces and "{" in imports...
    });

    this.registerExtraKeys();
  }

  // Fires when an attribute was added, removed, or updated
  attributeChangedCallback(attr, oldVal, newVal) {
    if (!this.editor) {
      return false;
    }
    switch (attr) {
      // case "theme":
      //     this.editor.setTheme( newVal );
      //     break;
      case "mode":
        this.editor.setOption('mode', newVal);
        break;
      // case "fontsize":
      //     this.editor.setFontSize( newVal );
      //     break;
      // case "softtabs":
      //     this.editor.getSession().setUseSoftTabs( newVal );
      //     break;
      // case "tern":
      //   if (newVal)
      // this.enableTern()
      //   break;

      case "tabsize":
        this.setOption("tabSize", newVal);
        break;
      // case "readonly":
      //     this.editor.setReadOnly( newVal );
      //     break;
      case "wrapmode":
        this.setOption("lineWrapping", newVal);
        break;
    }
  }

  setOption(name, value) {
    if (!this.editor) return; // we loose...
    this.editor.setOption(name, value);
  }

  doSave(text) {
    this.tryBoundEval(text // just a default implementation...
    );
  }

  getSelectionOrLine() {
    var text = this.editor.getSelection();
    if (text.length > 0) return text;else return this.editor.getLine(this.editor.getCursor("end").line);
  }

  getDoitContext() {
    return this.doitContext || window.that;
  }

  setDoitContext(context) {
    return this.doitContext = context;
  }

  getTargetModule() {
    // lazily initialize a target module name as fallback
    return this.targetModule || (this.targetModule = lively4url + '/unnamed_module_' + generateUUID().replace(/-/g, '_')); // make it relative to a real path so that relative modules work
  }

  setTargetModule(module) {
    return this.targetModule = module;
  }

  async boundEval(str) {
    // console.log("bound eval " + str)
    var targetModule = this.getTargetModule();

    if (targetModule.match(/.py$/)) {
      return this.boundEvalPython(str);
    }
    // Ensure target module loaded (for .js files only)
    if (targetModule.match(/.js$/)) {
      await System.import(targetModule);
    }
    console.log("EVAL (CM)", targetModule);
    // src, topLevelVariables, thisReference, <- finalStatement
    return boundEval(str, this.getDoitContext(), targetModule);
  }

  async boundEvalPython(str) {
    var result = "";
    var xterm = document.querySelector("lively-xterm.python");
    if (xterm) {
      var term = xterm.term;
      term.__socket.addEventListener('message', function (event) {
        result += event.data;
      });
      // how long do we want to wait?

      term.__sendData(str + "\n");

      while (!result.match(">>>")) {
        // busy wait for the prompt
        await lively.sleep(50);
      }
      // strip input and prompt.... oh what a hack
      return { value: result.replace(str, "").replace(/^[\r\n]+/, "").replace(/>>> $/, "") };
    } else {
      lively.notify("no open python terminal session found");
    }
    return { value: "" };
  }

  printWidget(name) {
    return this.wrapWidget(name, this.editor.getCursor(true), this.editor.getCursor(false));
  }

  wrapWidget(name, from, to, options) {
    var widget = document.createElement("span");
    widget.classList.add("lively-widget");
    widget.style.whiteSpace = "normal";
    var promise = lively.create(name, widget);
    promise.then(comp => {
      Object.assign(comp.style, {
        display: "inline",
        // backgroundColor: "rgb(250,250,250)",
        display: "inline-block",
        minWidth: "20px",
        minHeight: "20px"
      });
    });
    // #TODO, we assume that it will keep the first widget, and further replacements do not work.... and get therefore thrown away
    var marker = this.editor.doc.markText(from, to, Object.assign({
      replacedWith: widget
    }, options));
    promise.then(comp => comp.marker = marker);

    return promise;
  }
  
  wrapWidgetSync(name, from, to, options) {
    var widget = document.createElement("span");
    widget.classList.add("lively-widget");
    widget.style.whiteSpace = "normal";
    var comp = document.createElement(name);
    widget.appendChild(comp)
    
    Object.assign(comp.style, {
      display: "inline",
      // backgroundColor: "rgb(250,250,250)",
      display: "inline-block",
      minWidth: "20px",
      minHeight: "20px"
    });
    
    // #TODO, we assume that it will keep the first widget, and further replacements do not work.... and get therefore thrown away
    var marker = this.editor.doc.markText(from, to, Object.assign({
      replacedWith: widget
    }, options));
    comp.marker = marker;

    return comp;
  }

  async printResult(result, obj, isPromise) {
    var editor = this.editor;
    var text = result;
    var isAsync = false;
    this.editor.setCursor(this.editor.getCursor("end"
    // don't replace existing selection
    ));this.editor.replaceSelection(result, "around");
    if (obj && obj.__asyncresult__) {
      obj = obj.__asyncresult__; // should be handled in bound-eval.js #TODO
      isAsync = true;
    }
    var promisedWidget;
    var objClass = obj && obj.constructor && obj.constructor.name || typeof obj;
    if (isSet.call(obj)) {
      obj = Array.from(obj);
    }

    if (_.isMap(obj)) {
      var mapObj = {};
      Array.from(obj.keys()).sort().forEach(key => mapObj[key] = obj.get(key));
      obj = mapObj;
    }
    if (Array.isArray(obj) && !obj.every(ea => ea instanceof Node)) {
      if (obj.every(ea => typeof ea == 'object' && !(ea instanceof String))) {
        promisedWidget = this.printWidget("lively-table").then(table => {
          table.setFromJSO(obj);
          table.style.maxHeight = "300px";
          table.style.overflow = "auto";
          return table;
        });
      } else {
        promisedWidget = this.printWidget("lively-table").then(table => {
          table.setFromJSO(obj.map((ea, index) => {
            return {
              index: index,
              value: this.ensuredPrintString(ea)
            };
          }));
          table.style.maxHeight = "300px";
          table.style.overflow = "auto";
          return table;
        });
      }
    } else if (objClass == "Matrix") {
      // obj = obj.toString()
      debugger;
    } else if (typeof obj == 'object' && obj !== null) {
      promisedWidget = this.printWidget("lively-inspector").then(inspector => {
        inspector.inspect(obj);
        inspector.hideWorkspace();
        return inspector;
      });
    }
    if (promisedWidget) {
      var widget = await promisedWidget;
      var span = <span style="border-top:2px solid darkgray;color:darkblue">
          {isPromise ? "PROMISED" : ""} <u>:{objClass}</u> </span>;
      widget.parentElement.insertBefore(span, widget);
      span.appendChild(widget);
      if (isAsync && promisedWidget) {
        if (widget) widget.style.border = "2px dashed blue";
      }
    }
  }

  ensuredPrintString(obj) {
    var s = "";
    try {
      s += obj; // #HACK some objects cannot be printed any more
    } catch (e) {
      s += `UnprintableObject[Error: ${e}]`; // so we print something else
    }
    return s;
  }

  
  
  async tryBoundEval(str, printResult) {
    var resp = await this.boundEval(str);
    if (resp.isError) {
      var e = resp.value;
      console.error(e);
      if (printResult) {
        window.LastError = e;
        this.printResult(stripErrorString("" + e));
      } else {
        lively.handleError(e);
      }
      return e;
    }
    var result = resp.value;

    if (printResult) {
      // alaways wait on promises.. when interactively working...
      if (result && result.then) {
        //  && result instanceof Promise
        // we will definitly return a promise on which we can wait here
        result.then(result => {
          this.printResult("RESOLVED: " + this.ensuredPrintString(result), result, true);
        }).catch(error => {
          console.error(error);
          // window.LastError = error;
          this.printResult(stripErrorString("Error in Promise: \n" + error));
        });
      } else {
        this.printResult(" " + this.ensuredPrintString(result), result);
        if (result instanceof HTMLElement) {
          try {
            lively.showElement(result);
          } catch (e) {
            // silent fail... not everything can be shown...
          }
        }
      }
    }
    return result;
  }

  async inspectIt(str) {
    var result = await this.boundEval(str);
    if (!result.isError) {
      result = result.value;
    }
    if (result.then) {
      result = await result; // wait on any promise
    }
    lively.openInspector(result, undefined, str);
  }
  
  async trySWACopilot(text) {
    var start = Date.now()
    var result = await fetch(`https://lively-kernel.org/swacopilot?prime=True&maxlength=300&temperature=0.8&text=` + 
                              encodeURIComponent(text)).then(r => r.json())
    if(result.generation) {
      this.editor.setCursor(this.editor.getCursor("end"));
      this.editor.replaceSelection(result.generation, "around");
    }
    lively.notify("SWA Copilot: " + (Date.now() - start) + "ms")
  } 

  doSave(text) {
    this.tryBoundEval(text // just a default implementation...
    );
  }

  disconnectedCallback() {
    this.shadowText.handleDetachedCM()
    this._attached = false;
  }
  
  getWidgets() {
    return this.shadowRoot.querySelectorAll(".inline-embedded-widget")
  }
  
  ensureTextContent() {
    this.getWidgets().forEach(ea => {
      if (ea.updateRangePreSave) {
        ea.updateRangePreSave()
      }
    })
  }

  // #important
  get value() {
    if (this.editor) {
      this.ensureTextContent()
      return this.editor.getValue();
    } else {
      return this._value;
    }
  }

  set value(text) {
    if (text === undefined) text = "";
    if (this.editor) {
      this.editor.setValue(text);
    } else {
      this._value = text;
    }
    lively.sleep(0).then(() => {
      if (this.editor) this.editor.refresh();
    });
  }

  setCustomStyle(source) {
    this.shadowRoot.querySelector("#customStyle").textContent = source;
  }

  getCustomStyle(source) {
    return this.shadowRoot.querySelector("#customStyle").textContent;
  }

  encodeHTML(s) {
    return s.replace("&", "&amp;").replace("<", "&lt;");
  }

  decodeHTML(s) {
    return s.replace("&lt;", "<").replace("&amp;", "&");
  }

  resize() {
    // #ACE Component compatiblity
  }

  enableAutocompletion() {
    // #ACE Component compatiblity
  }

  get isJavaScript() {
    if (!this.editor) return false;
    let mode = this.editor.getOption("mode");
    return mode === "javascript" || mode === 'text/jsx';
  }

  get isMarkdown() {
    if (!this.editor) return false;
    return this.editor.getOption("mode") == "gfm";
  }

  get isHTML() {
    if (!this.editor) return false;
    return this.editor.getOption("mode") == "text/html";
  }

  async changeModeForFile(filename) {
    if (!this.editor) return;

    var mode = "text";
    // #TODO there must be some kind of automatching?
    if (filename.match(/\.html$/)) {
      mode = "text/html";
    } else if (filename.match(/\.md$/)) {
      mode = "gfm";
    } else if (filename.match(/\.tex$/)) {
      mode = "text/x-stex";
    } else if (filename.match(/\.css$/)) {
      mode = "css";
    } else if (filename.match(/\.xml$/)) {
      mode = "xml";
    } else if (filename.match(/\.java$/)) {
      mode = "text/x-java";
    } else if (filename.match(/\.json$/)) {
      mode = "javascript";
    } else if (filename.match(/\.js$/)) {
      mode = "text/jsx";
    } else if (filename.match(/\.mjs$/)) {
      mode = "text/jsx";
    } else if (filename.match(/\.ts$/)) {
      mode = "text/typescript";
    } else if (filename.match(/\.py$/)) {
      mode = "text/x-python";
    } else if (filename.match(/\.c$/)) {
      mode = "text/x-csrc";
    } else if (filename.match(/\.cpp$/)) {
      mode = "text/x-c++src";
    } else if (filename.match(/\.h$/)) {
      mode = "text/x-c++src";
    } else if (filename.match(/\.sh$/) || filename.match(/Makefile/)) {
      mode = "text/x-sh";
    }

    this.mode = mode;
    this.editor.setOption("mode", mode);
    if (mode == "gfm" || mode == "text/x-stex") {
      // #TODO make language customizable
      var m = this.value.match(/^.*lang\:(.._..)/);
      if (m) {
        var lang = m[1];
        var dict = await spellCheck.loadDictLang(lang);
        if (dict) {
          lively.notify("start spell checking lang: " + lang);
          spellCheck.startSpellCheck(this.editor, dict);
        } else {
          console.log("spellchecking language not found: " + lang);
        }
      } else {
        spellCheck.startSpellCheck(this.editor, (await spellCheck.current()));
      }
    }
    if (mode == "text/x-sh") {
      this.editor.setOption("indentWithTabs", true);
    }
  }

  livelyPrepareSave() {
    if (!this.editor) {
      return;
    }
    this.textContent = this.encodeHTML(this.editor.getValue());
  }

  livelyPreMigrate() {
    if (this.editor) {
      this.lastScrollInfo = this.editor.getScrollInfo(); // #Example #PreserveContext
    }
  }

  focus() {
    if (this.editor) {
      // if (this.editor.options.readOnly == "nocursor") {
      //   // console.warn("[lively-code-mirror] prevent focus")
      //   return
      // }
      this.editor.focus();
    }
  }

  isFocused(doc) {
    doc = doc || document;
    if (doc.activeElement === this) return true;
    // search recursively in shadowDoms
    if (doc.activeElement && doc.activeElement.shadowRoot) {
      return this.isFocused(doc.activeElement.shadowRoot);
    }
    return false;
  }

  async livelyMigrate(other) {
    lively.addEventListener("Migrate", this, "editor-loaded", evt => {
      if (evt.composedPath()[0] !== this) return; // bubbled from another place... that is not me!
      lively.removeEventListener("Migrate", this, "editor-loaded" // make sure we migrate only once
      );this.value = other.value;
      if (other.lastScrollInfo) {
        this.editor.scrollTo(other.lastScrollInfo.left, other.lastScrollInfo.top);
      }
    });
  }

  fixHintsPosition() {
    lively.setPosition(this.shadowRoot.querySelector("#code-mirror-hints"), pt(-document.scrollingElement.scrollLeft, -document.scrollingElement.scrollTop).subPt(lively.getClientPosition(this)));
  }



  async addTernFile(name, url, text) {
    if (!this.ternServer) return;
    url = url || name;
    text = text || (await fetch(url).then(r => r.text()));
    this.ternServer.server.addFile(name, text);
  }

  mergeView(originalText, originalLeftText) {
    var target = this.shadowRoot.querySelector("#code-mirror-container");
    target.innerHTML = "";
    this._mergeView = CodeMirror.MergeView(target, {
      value: this.value,
      origLeft: originalLeftText,
      orig: originalText,
      lineNumbers: true,
      mode: this.editor.getOption('mode'),
      scrollbarStyle: this.editor.getOption('scrollbarStyle'),
      highlightDifferences: true,
      connect: "align",
      lineWrapping: true,
      collapseIdentical: false
    });
    // if (this._mergeView.right) {
    // this.setEditor(this._mergeView.right.edit)
    // }
    this.setEditor(this._mergeView.editor
    // this.resizeMergeView(this._mergeView)
    ());
  }

  resizeMergeView(mergeView) {
    function editorHeight(editor) {
      if (!editor) return 0;
      return editor.getScrollInfo().height;
    }

    function mergeViewHeight(mergeView) {
      return Math.max(editorHeight(mergeView.leftOriginal()), editorHeight(mergeView.editor()), editorHeight(mergeView.rightOriginal()));
    }
    var height = mergeViewHeight(mergeView);
    for (;;) {
      if (mergeView.leftOriginal()) mergeView.leftOriginal().setSize(null, height);
      mergeView.editor().setSize(null, height);
      if (mergeView.rightOriginal()) mergeView.rightOriginal().setSize(null, height);

      var newHeight = mergeViewHeight(mergeView);
      if (newHeight >= height) break;else height = newHeight;
    }
    mergeView.wrap.style.height = height + "px";
  }

  async hideDataURLs() {
    var regEx = new RegExp("[\"\'](data:[^\"\']*)[\"\']", "g");
    do {
      var m = regEx.exec(this.value);
      if (m) {
        var from = m.index;
        var to = m.index + m[0].length;
        await this.wrapWidget("span", this.editor.posFromIndex(from), this.editor.posFromIndex(to)).then(div => {
          div.style.backgroundColor = "rgb(240,240,240)";

          if (m[1].match(/^data:image/)) {
            var img = document.createElement("img");
            img.src = m[1];
            img.title = m[1].slice(0, 50) + "...";
            img.style.maxHeight = "100px";

            div.appendChild(document.createTextNode("\""));
            div.appendChild(img);
            div.appendChild(document.createTextNode("\""));
          } else {
            div.innerHTML = "\"" + m[1].slice(0, 50) + "..." + "\"";
          }
        });
      }
    } while (m);
  }

  //    async wrapImageLinks() {
  //     var regEx = new RegExp("\!\[\]\(([A-Za-z0-9_ .]\.((jpg)|(png)))$\)", "g");
  //     do {
  //       var m = regEx.exec(this.value);
  //       if (m) {
  //         var from = m.index
  //         var to = m.index + m[0].length
  //         var url = m[1]
  //         await this.wrapWidget("span", this.editor.posFromIndex(from),
  //                               this.editor.posFromIndex(to)).then( div => {
  //           div.style.backgroundColor = "rgb(240,240,240)"

  //           if (m[1].match(/^data:image/)) {
  //             var img = document.createElement("img")
  //             img.src = m[1]
  //             img.title = m[1].slice(0,50) + "..."
  //             img.style.maxHeight = "100px"

  //             div.appendChild(document.createTextNode("\""))
  //             div.appendChild(img)
  //             div.appendChild(document.createTextNode("\""))
  //           } else {
  //             div.innerHTML = "\""+ m[1].slice(0,50) + "..." + "\""
  //           }
  //         })

  //       }
  //     } while (m);
  //   }


  async wrapImports() {
    // dev mode alternative to #DevLayers, a #S3Pattern: add code the scopes your dev example inline while developing
    if (this.id !== 'spike') {
      // lively.warn('skip because id is not spike')
      return;
    }
    // lively.success('wrap imports in spike')

    const getImportDeclarationRegex = () => {
      const LiteralString = `(["][^"\\n\\r]*["]|['][^'\\n\\r]*['])`;
      const JavaScriptIdentifier = '([a-zA-Z$_][a-zA-Z0-9$_]*)';

      const ImportSpecifierPartSimple = `(${JavaScriptIdentifier})`;
      const ImportSpecifierPartRename = `(${JavaScriptIdentifier}\\s+as\\s+${JavaScriptIdentifier})`;
      const ImportSpecifierPart = `(${ImportSpecifierPartSimple}|${ImportSpecifierPartRename})`;
      // ImportSpecifier: {foo} or {foo as bar}
      const ImportSpecifier = `({\\s*((${ImportSpecifierPart}\\s*\\,\\s*)*${ImportSpecifierPart}\\,?)?\\s*})`;
      // ImportDefaultSpecifier: foo
      const ImportDefaultSpecifier = `(${JavaScriptIdentifier})`;
      // ImportNamespaceSpecifier: * as foo
      const ImportNamespaceSpecifier = `(\\*\\s*as\\s+${JavaScriptIdentifier})`;
      const anySpecifier = `(${ImportSpecifier}|${ImportDefaultSpecifier}|${ImportNamespaceSpecifier})`;
      // ImportDeclaration: import [any] from Literal
      const ImportDeclaration = `import\\s*(${anySpecifier}\\s*\\,\\s*)*${anySpecifier}\\s*from\\s*${LiteralString}(\\s*\\;)?`;

      return ImportDeclaration;
    };

    var regEx = new RegExp(getImportDeclarationRegex(), 'g');

    do {
      var m = regEx.exec(this.value);
      if (m) {
        await LivelyCodeMirrorWidgetImport.importWidgetForRange(this, m);
      }
    } while (m);
  }

  async wrapLinks() {
    // dev mode
    if (this !== window.that) {
      return;
    }
    var regEx = new RegExp("\<([a-zA-Z0-9]+\:\/\/[^ ]+)\>", "g");
    do {
      var m = regEx.exec(this.value);
      if (m) {
        lively.warn("wrap link: " + m[0]);
        var from = m.index;
        var to = m.index + m[0].length;
        var link = m[1];
        // #TODO check for an existing widget and reuse / update it...
        await this.wrapWidget("span", this.editor.posFromIndex(from), this.editor.posFromIndex(to)).then(widget => {
          window.lastWidget = widget;

          widget.style.backgroundColor = "rgb(120,120, 240)";
          var input = <input></input>;
          input.value = m[0];

          lively.warn("new input " + input);

          input.addEventListener("keydown", evt => {
            var range = widget.marker.find();
            if (evt.keyCode == 13) {
              // ENTER
              // #TODO how to replace // update text without replacing widgets
              this.editor.replaceRange(input.value, range.from, range.to // @Stefan, your welcome! ;-)
              );this.wrapLinks // don't wait and do what you can now
              ();
            }
            if (evt.keyCode == 37) {
              // Left
              if (input.selectionStart == 0) {
                this.editor.setSelection(range.from, range.from);
                this.focus();
              }
            }

            if (evt.keyCode == 39) {
              // Right
              if (input.selectionStart == input.value.length) {
                this.editor.setSelection(range.to, range.to);
                this.focus();
              }
            }
          });

          widget.appendChild(input
          // widget.appendChild(<button click={e => {
          //   lively.openBrowser(link)  // #TODO fix browse and open browser...
          // }}>browse</button>)
          );
        });
      }
    } while (m);
  }

  checkSyntax() {
    if (this.isJavaScript) {
      SyntaxChecker.checkForSyntaxErrors(this.editor);
      // this.wrapImports();
      this.wrapLinks();
    }
    if (this.isMarkdown || this.isHTML) {
      this.hideDataURLs();
    }
  }

  find(str) {
    // #TODO this is horrible... Why is there not a standard method for this?
    if (!this.editor) return;
    var found = false;
    this.value.split("\n").forEach((ea, index) => {
      var startPos = ea.indexOf(str);
      if (!found && startPos != -1) {
        this.editor.setCursor(index + 20, 10000); // line end ;-)
        this.editor.focus();
        this.editor.setSelection({ line: index, ch: startPos }, { line: index, ch: startPos + str.length });
        found = ea;
      }
    });
  }

  scrollToLine(line) {
    this.editor.scrollTo(null, this.editor.heightAtLine(line - 1, "local"));
  }
  
  
  // custom 
  posFromIndex(off, text=this.value) {
    var line = 0
    var total = 0
    for(let s of text.split("\n")) {
      var length = s.length  
      if (total + length >  off) {
        break;
      }
      total += length + 1
      line++
    }
    var ch = off - total
    return {ch: ch, line: line}
  }
  
  scrollToCodeElement(data, optionalText) {
    var cm = this.editor //  ok, to many levels of editor involved here...
    
    // #BUG when dealing with babylonian source code, the source code we are editing might not be the same we 
    // are storing... though the lines should be ok
    // 
    // var start = cm.posFromIndex(data.start)
    // var end = cm.posFromIndex(data.end)
    
    var start = this.posFromIndex(data.start, optionalText)
    var end = this.posFromIndex(data.end, optionalText)
    
    

    cm.setSelection(start, end)

    // scroll only if necessary
    var rect = cm.getWrapperElement().getBoundingClientRect();
    var topVisibleLine = cm.lineAtHeight(rect.top, "window"); 
    var bottomVisibleLine = cm.lineAtHeight(rect.bottom, "window");

    var topMarginLines = 5
    var bottomMarginLines = 20
    if (start.line - topMarginLines < topVisibleLine) {
      this.scrollToLine(start.line - topMarginLines)
    } 
    if (end.line + bottomMarginLines > bottomVisibleLine) {
      var visibleLines = (bottomVisibleLine - topVisibleLine)
      this.scrollToLine(end.line - visibleLines + bottomMarginLines)
    }
  }

  unsavedChanges() {
    if (this.editor && this.editor.getValue() === "") return false;
    return true; // workspaces should be treated carefully
  }

  onCursorActivity() {
    var container = lively.query(this, "lively-container");
    if (!container) return;
    var navbar = lively.query(this, "lively-container-navbar");
    if (!navbar) return;
    navbar.onDetailsContentCursorActivity(this.editor, this.editor.getCursor("start"), this.editor.getCursor("end"));
  }

  livelyMinimizedTitle() {
    return this.value.slice(0, 80);
  }

  /*MD ## Active Expression Support MD*/

  async updateAExprDependencies() {
    if (!this.isJavaScript || !lively.query(this, "lively-container")) return;
    if(!Preferences.get("EnableAEDebugging")) return;
    var url = this.fileURL()
    new AEGutter(await this.editor, url, this.valid.bind(this));
  }

  fileURL() {
    return lively.query(this, "lively-container").getURL().toString();
  }

  valid() {
    return lively.allParents(this, [], true).includes(document.body);
  }
}