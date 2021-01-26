/*MD 
# CodeMirror

Workspace / main source code editing component. 

![](lively-code-mirror.png){height=200}

MD*/

import { promisedEvent, through, uuid as generateUUID } from 'utils';
import boundEval from 'src/client/bound-eval.js';
import Morph from "src/components/widgets/lively-morph.js";
import diff from 'src/external/diff-match-patch.js';
import SyntaxChecker from 'src/client/syntax.js';
import { debounce } from "utils";
import Preferences from 'src/client/preferences.js';
import { pt } from 'src/client/graphics.js';
import 'src/client/stablefocus.js';
import Strings from 'src/client/strings.js';
import { letsScript } from 'src/client/vivide/vivide.js';
import LivelyCodeMirrorWidgetImport from 'src/components/widgets/lively-code-mirror-widget-import.js';
import LivelyCodeMirrorCodeProvider from 'src/components/widgets/lively-code-mirror-code-provider.js';
import openMenu from 'src/components/widgets/lively-code-mirror-context-menu.js';
import * as spellCheck from "src/external/codemirror-spellcheck.js";
import { isSet } from 'utils';
import fake from "./lively-code-mirror-fake.js";
import CodeMirror from "src/external/code-mirror/lib/codemirror.js";
self.CodeMirror = CodeMirror; // for modules
let loadPromise = undefined;
import { loc, range } from 'utils';
import indentationWidth from 'src/components/widgets/indent.js';
import { DependencyGraph } from 'src/client/dependency-graph/graph.js';
import { getDependencyMapForFile } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
import ContextMenu from 'src/client/contextmenu.js';

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
      eval(code);
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
    // console.log("loadModules", loadPromise);
    if (loadPromise && !force) return loadPromise;
    loadPromise = (async () => {

      await this.loadModule("addon/fold/foldcode.js");

      await this.loadModule("mode/javascript/javascript.js");
      await this.loadModule("mode/xml/xml.js");
      await this.loadModule("mode/css/css.js");
      await this.loadModule("mode/diff/diff.js");

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
      await this.loadModule("addon/hint/javascript-hint.js");
      await this.loadModule("addon/search/searchcursor.js");
      await this.loadModule("addon/search/search.js");
      await this.loadModule("addon/search/jump-to-line.js");
      await this.loadModule("addon/search/matchesonscrollbar.js");
      await this.loadModule("addon/search/match-highlighter.js");
      await this.loadModule("addon/scroll/annotatescrollbar.js");
      await this.loadModule("addon/comment/comment.js");
      await this.loadModule("addon/dialog/dialog.js");
      await this.loadModule("addon/scroll/simplescrollbars.js"

      //await System.import("https://raw.githubusercontent.com/jshint/jshint/master/dist/jshint.js");
      //await lively.loadJavaScriptThroughDOM("jshintAjax", "https://ajax.aspnetcdn.com/ajax/jshint/r07/jshint.js");
      //await lively.loadJavaScriptThroughDOM("eslint", "http://eslint.org/js/app/eslint.js");
      );await this.loadModule("addon/lint/lint.js");
      await this.loadModule("addon/lint/javascript-lint.js");
      await this.loadModule("../eslint/eslint.js");
      // await this.loadModule("../eslint/eslint-lint.js", force);
      await System.import(lively4url + '/src/external/eslint/eslint-lint.js');
      await this.loadModule("addon/merge/merge.js");
      await this.loadModule("addon/selection/mark-selection.js");
      await this.loadModule("keymap/sublime.js");
      await System.import(lively4url + '/src/components/widgets/lively-code-mirror-hint.js');

      this.loadCSS("addon/hint/show-hint.css");
      this.loadCSS("addon/lint/lint.css");
      lively.loadCSSThroughDOM("CodeMirrorCSS", lively4url + "/src/components/widgets/lively-code-mirror.css");
    })();
    return loadPromise;
  }

  // #TODO #Refactor not needed anymore
  static async loadTernModules() {
    if (this.ternIsLoaded) return;

    await this.loadModule("addon/tern/tern.js");

    var terndir = lively4url + '/src/external/tern/';
    await lively.loadJavaScriptThroughDOM("tern_acorn", terndir + 'acorn.js');
    await lively.loadJavaScriptThroughDOM("tern_acorn_loose", terndir + 'acorn_loose.js');
    await lively.loadJavaScriptThroughDOM("tern_walk", terndir + 'walk.js');
    await lively.loadJavaScriptThroughDOM("tern_polyfill", terndir + 'polyfill.js');
    await lively.loadJavaScriptThroughDOM("tern_signal", terndir + 'signal.js');
    await lively.loadJavaScriptThroughDOM("tern_tern", terndir + 'tern.js');
    await lively.loadJavaScriptThroughDOM("tern_def", terndir + 'def.js');
    await lively.loadJavaScriptThroughDOM("tern_comment", terndir + 'comment.js');
    await lively.loadJavaScriptThroughDOM("tern_infer", terndir + 'infer.js');
    await lively.loadJavaScriptThroughDOM("tern_plugin_modules", terndir + 'modules.js');
    await lively.loadJavaScriptThroughDOM("tern_plugin_esmodules", terndir + 'es_modules.js');
    this.ternIsLoaded = true;
  }

  astCapabilities(cm) {
    return System.import('src/components/widgets/ast-capabilities.js').then(m => {
      if (!this.myASTCapabilities || !(this.myASTCapabilities instanceof m.default)) {
        const codeProvider = new LivelyCodeMirrorCodeProvider(this, cm);
        this.myASTCapabilities = new m.default(codeProvider);
      }

      return this.myASTCapabilities;
    });
  }

  autoCompletion(cm) {
    return System.import('src/components/widgets/auto-completion.js').then(m => new m.default(this, cm));
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
  }

  applyAttribute(attr) {
    var value = this.getAttribute(attr);
    if (value !== undefined) {
      this.setAttribute(attr, value);
    }
  }

  async attachedCallback() {
    if (this.isLoading || this.editor) return;
    this.isLoading = true;
    this.root = this.shadowRoot; // used in code mirror to find current element
    await LivelyCodeMirror.loadModules(); // lazy load modules...

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

    await lively.sleep(0);
    this.editor.refresh();
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
    this.astCapabilities(this.editor);
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

    );editor.on("change", evt => this.dispatchEvent(new CustomEvent("change", { detail: evt })));
    editor.on("change", (() => this.checkSyntax()).debounce(500));
    editor.on("change", (() => this.astCapabilities(editor).then(ac => ac.codeChanged())).debounce(200));

    editor.on("cursorActivity", (() => this.onCursorActivity()).debounce(500));

    // apply attributes
    _.map(this.attributes, ea => ea.name).forEach(ea => this.applyAttribute(ea));

    // if(Preferences.get('UseTernInCodeMirror')) {
    //   this.enableTern();
    // }
    editor.on("keydown", (...args) => this.keyEvent(...args));
  }

  keyEvent(cm, evt) {

    if (this.classList.contains('ast-mode') && !evt.repeat) {
      function unifiedKeyDescription(e) {
        const alt = e.altKey ? 'Alt-' : '';
        const ctrl = e.ctrlKey ? 'Ctrl-' : '';
        const shift = e.shiftKey ? 'Shift-' : '';
        return ctrl + shift + alt + e.key;
      }
      const operations = {
        Escape: () => {
          this.classList.remove('ast-mode');
        },
        i: () => {
          this.astCapabilities(cm).then(ac => ac.inlineLocalVariable());
        }
      };

      const operation = operations[unifiedKeyDescription(evt)];
      if (operation) {
        evt.preventDefault();
        evt.codemirrorIgnore = true;

        operation();
      } else {
        lively.notify(unifiedKeyDescription(evt), [this, cm, evt]);
      }
    }
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

      this.extraKeys = Object.assign(defaultASTHandlers, {

        // #KeyboardShortcut Alt-X shortcut for experomental features
        "Alt-X": cm => this.astCapabilities(cm).then(ac => ac.braveNewWorld()),
        // #KeyboardShortcut Alt-B Alt-N wrap selection in lively notify
        "Alt-B Alt-N": cm => this.astCapabilities(cm).then(ac => ac.livelyNotify()),
        // #KeyboardShortcut Alt-B Alt-U insert lively4url
        "Alt-B Alt-U": cm => this.astCapabilities(cm).then(ac => ac.lively4url()),
        // #KeyboardShortcut Alt-N negate an expression
        "Alt-N": cm => this.astCapabilities(cm).then(ac => ac.negateExpression()),
        // #KeyboardShortcut Alt-U Replace parent node with selection
        "Alt-U": cm => this.astCapabilities(cm).then(ac => ac.replaceParentWithSelection()),
        // #KeyboardShortcut Alt-O Insert new line below
        "Alt-O": cm => this.astCapabilities(cm).then(ac => ac.newlineAndIndent(true)),
        // #KeyboardShortcut Shift-Alt-O Insert new line above
        "Shift-Alt-O": cm => this.astCapabilities(cm).then(ac => ac.newlineAndIndent(false)),

        // #KeyboardShortcut Alt-S Swap then and else block of a conditional
        "Alt-S": cm => this.astCapabilities(cm).then(ac => ac.swapConditional()),
        // #TODO: generate code with Alt-G Alt-_
        "Alt-G Alt-I": cm => this.astCapabilities(cm).then(ac => ac.generateIf('condition')),
        "Ctrl-Alt-G Ctrl-Alt-I": cm => this.astCapabilities(cm).then(ac => ac.generateIf('then')),
        "Shift-Alt-G Alt-I": cm => this.astCapabilities(cm).then(ac => ac.generateIf('else')),

        // #KeyboardShortcut Alt-/ insert markdown comment
        "Alt-/": cm => this.astCapabilities(cm).then(ac => ac.insertMarkdownComment('condition')),

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
        // #KeyboardShortcut Ctrl-F search
        "Ctrl-F": cm => {
          // something immediately grabs the "focus" and we close the search dialog..
          // #Hack...
          setTimeout(() => {
            this.editor.execCommand("findPersistent");
            var searchField = this.shadowRoot.querySelector(".CodeMirror-search-field");
            if (searchField) searchField.focus();
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
          this.astCapabilities(cm).then(ac => ac.expandSelection(cm));
        },
        // #KeyboardShortcut Alt-Down Reduce selection in ast-aware manner
        "Alt-Down": cm => {
          this.astCapabilities(cm).then(ac => ac.reduceSelection(cm));
        },
        // #KeyboardShortcut Alt-Shift-Up Select previous like this
        "Shift-Alt-Up": cm => {
          this.astCapabilities(cm).then(ac => ac.selectNextASTNodeLikeThis(true));
        },
        // #KeyboardShortcut Alt-Shift-Down Select next like this
        "Shift-Alt-Down": cm => {
          this.astCapabilities(cm).then(ac => ac.selectNextASTNodeLikeThis(false));
        },

        // #KeyboardShortcut Alt-Left Select previous element in ast-aware manner
        "Alt-Left": cm => {
          this.astCapabilities(cm).then(ac => ac.selectNextASTChild(true));
        },
        // #KeyboardShortcut Alt-Right Select next element in ast-aware manner
        "Alt-Right": cm => {
          this.astCapabilities(cm).then(ac => ac.selectNextASTChild(false));
        },
        // #KeyboardShortcut Alt-Shift-Left Select previous reference
        "Shift-Alt-Left": cm => {
          this.astCapabilities(cm).then(ac => ac.selectNextReference(true));
        },
        // #KeyboardShortcut Alt-Shift-Right Select next reference
        "Shift-Alt-Right": cm => {
          this.astCapabilities(cm).then(ac => ac.selectNextReference(false));
        },

        // #KeyboardShortcut Alt-J Jump to declaration of this identifier
        "Alt-J": cm => {
          this.astCapabilities(cm).then(ac => ac.selectDeclaration());
        },
        // #KeyboardShortcut Alt-R Rename this identifier
        "Alt-R": cm => {
          this.astCapabilities(cm).then(ac => ac.rename());
        },
        // #KeyboardShortcut Alt-Enter Toggle AST Mode
        "Alt-Enter": cm => {
          this.classList.toggle('ast-mode');
        },
        // #KeyboardShortcut Alt-I Inline variable
        "Alt-I": cm => {
          this.astCapabilities(cm).then(ac => ac.inlineLocalVariable());
        },
        // #KeyboardShortcut Alt-E Extract Expression into a local variable
        "Alt-E": cm => {
          this.astCapabilities(cm).then(ac => ac.extractExpressionIntoLocalVariable());
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

        // #KeyboardShortcut Alt-Q sample shortcut for auto-completion
        "Alt-Q": cm => {
          this.autoCompletion(cm).then(ac => ac.complete(this, cm));
        }

      });
    }

    return this.extraKeys;
  }

  openContextMenu(cm) {
    this.astCapabilities(cm).then(ac => {
      openMenu(ac, cm, this);
    });
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
    return this.doitContext;
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

  doSave(text) {
    this.tryBoundEval(text // just a default implementation...
    );
  }

  detachedCallback() {
    this._attached = false;
  }

  get value() {
    if (this.editor) {
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
    } else if (filename.match(/\.json$/)) {
      mode = "javascript";
    } else if (filename.match(/\.js$/)) {
      mode = "text/jsx";
    } else if (filename.match(/\.mjs$/)) {
      mode = "text/jsx";
    } else if (filename.match(/\.py$/)) {
      mode = "text/x-python";
    } else if (filename.match(/\.c$/)) {
      mode = "text/x-csrc";
    } else if (filename.match(/\.cpp$/)) {
      mode = "text/x-c++src";
    } else if (filename.match(/\.h$/)) {
      mode = "text/x-c++src";
    } else if (filename.match(/\.sh$/)) {
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
    if (this.editor) this.editor.focus();
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
    lively.setPosition(this.shadowRoot.querySelector("#code-mirror-hints"), pt(-document.scrollingElement.scrollLeft, -document.scrollingElement.scrollTop).subPt(lively.getGlobalPosition(this)));
  }

  //   async enableTern() {
  //     await LivelyCodeMirror.loadTernModules()

  //     var ecmascriptdefs = await fetch(lively4url + "/src/external/tern/ecmascript.json").then(r => r.json())
  //     var browserdefs = await fetch(lively4url + "/src/external/tern/browser.json").then(r => r.json())
  //     // var chaidefs = await fetch(lively4url + "/src/external/tern/chai.json").then(r => r.json())

  //     // Options supported (all optional):
  //     // * defs: An array of JSON definition data structures.
  //     // * plugins: An object mapping plugin names to configuration
  //     //   options.
  //     // * getFile: A function(name, c) that can be used to access files in
  //     //   the project that haven't been loaded yet. Simply do c(null) to
  //     //   indicate that a file is not available.
  //     // * fileFilter: A function(value, docName, doc) that will be applied
  //     //   to documents before passing them on to Tern.
  //     // * switchToDoc: A function(name, doc) that should, when providing a
  //     //   multi-file view, switch the view or focus to the named file.
  //     // * showError: A function(editor, message) that can be used to
  //     //   override the way errors are displayed.
  //     // * completionTip: Customize the content in tooltips for completions.
  //     //   Is passed a single argument the completion's data as returned by
  //     //   Tern and may return a string, DOM node, or null to indicate that
  //     //   no tip should be shown. By default the docstring is shown.
  //     // * typeTip: Like completionTip, but for the tooltips shown for type
  //     //   queries.
  //     // * responseFilter: A function(doc, query, request, error, data) that
  //     //   will be applied to the Tern responses before treating them

  //     // It is possible to run the Tern server in a web worker by specifying
  //     // these additional options:
  //     // * useWorker: Set to true to enable web worker mode. You'll probably
  //     //   want to feature detect the actual value you use here, for example
  //     //   !!window.Worker.
  //     // * workerScript: The main script of the worker. Point this to
  //     //   wherever you are hosting worker.js from this directory.
  //     // * workerDeps: An array of paths pointing (relative to workerScript)
  //     //   to the Acorn and Tern libraries and any Tern plugins you want to
  //     //   load. Or, if you minified those into a single script and included
  //     //   them in the workerScript, simply leave this undefined.

  //     this.ternServer = new CodeMirror.TernServer({
  //       defs: [ecmascriptdefs, browserdefs], // chaidefs
  //       plugins: {
  //         es_modules: {}
  //       },
  //       getFile: (name, c) => {
  //         lively.notify("get file " + name)
  //         c(null)
  //       },
  //       // responseFilter: (doc, query, request, error, data) => {
  //       //  return data
  //       // }

  //     });

  //     this.editor.setOption("extraKeys", Object.assign({},
  //       this.editor.getOption("extraKeys"),
  //       {
  //         "Ctrl-Space": (cm) => {
  //           this.fixHintsPosition();
  //           this.ternServer.complete(cm);
  //         },
  //         "Ctrl-Alt-I": (cm) => { this.ternServer.showType(cm); },
  //         "Ctrl-O": (cm) => { this.ternServer.showDocs(cm); },
  //         "Alt-.": (cm) => { this.ternServer.jumpToDef(cm); },
  //         "Alt-,": (cm) => { this.ternServer.jumpBack(cm); },
  //         "Ctrl-Q": (cm) => { this.ternServer.rename(cm); },
  //         "Ctrl-.": (cm) => { this.ternServer.selectName(cm); }
  //       }))

  //     this.editor.on("cursorActivity", (cm) => { this.ternServer.updateArgHints(cm); });
  //   }


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
      this.wrapImports();
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

  unsavedChanges() {
    if (this.editor.getValue() === "") return false;
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

  async dependencyGraph() {
    return this._deps || (this._deps = new DependencyGraph((await this.astCapabilities(this.editor))));
  }

  async updateAExprDependencies() {
    await this.editor;
    const dependencyGraph = await this.dependencyGraph();
    if (!dependencyGraph.capabilities.canParse || !dependencyGraph.hasActiveExpressionsDirective) {
      this.hideAExprDependencyGutter();
      this.resetAExprTextMarkers();
      this.resetAExprDependencyTextMarkers();
      return;
    }
    // this.showAExprTextMarkers();
    await this.showAExprDependencyGutter();
    const dependencyMap = await this.allDependencies();
    this.showAExprDependencyGutterMarkers(dependencyMap);
  }

  async showAExprTextMarkers() {
    const editor = await this.editor;
    await this.resetAExprTextMarkers();
    const dependencyGraph = await this.dependencyGraph();
    dependencyGraph.getAllActiveExpressions().forEach(path => {
      const r = range(path.node.loc).asCM();
      const mark = this.editor.markText(r[0], r[1], {
        css: "background-color: #3BEDED"
      });
      mark.isAExprTextMarker = true;
    });
  }

  async resetAExprTextMarkers() {
    const editor = await this.editor;
    editor.getAllMarks().forEach(mark => {
      if (mark.isAExprTextMarker) {
        mark.clear();
      }
    });
  }

  async showAExprDependencyGutter() {
    const id = "activeExpressionGutter";
    const editor = await this.editor;
    let gutters = editor.getOption("gutters");
    if (!gutters.some(marker => marker === id)) {
      editor.setOption('gutters', [...gutters, id]);
    };
  }

  async hideAExprDependencyGutter() {
    const id = "activeExpressionGutter";
    const editor = await this.editor;
    let gutters = editor.getOption("gutters");
    gutters = gutters.filter(marker => marker !== id);
    editor.setOption('gutters', gutters);
  }

  async resetAExprDependencyTextMarkers() {
    const editor = await this.editor;
    editor.getAllMarks().forEach(mark => {
      if (mark.isAExprDependencyTextMarker) {
        mark.clear();
      }
    });
  }

  async showAExprDependencyTextMarkers() {
    await this.editor;
    await this.resetAExprDependencyTextMarkers();
    const cursor = this.editor.getCursor();
    const dependencyGraph = await this.dependencyGraph();
    const aexprPath = dependencyGraph.getAexprAtCursor(cursor);
    if (!aexprPath) return;
    const deps = dependencyGraph.resolveDependencies(aexprPath.get("arguments")[0]);
    deps.forEach(path => {
      const r = range(path.node.loc).asCM();
      const mark = this.editor.markText(r[0], r[1], {
        css: "background-color: orange"
      });
      mark.isAExprDependencyTextMarker = true;
    });
  }

  async showAExprDependencyGutterMarkers(dependencyMap) {
    const lines = [];

    await this.editor;

    for (const [statement, aExprs] of dependencyMap.entries()) {
      const line = statement.node.loc.start.line - 1;
      if (!lines[line]) {
        lines[line] = [];
      }
      for (let aExpr of aExprs) {
        lines[line].push(aExpr);
      }
    }

    this.editor.doc.clearGutter('activeExpressionGutter');
    lines.forEach((deps, line) => {
      this.drawAExprGutter(line, deps);
    });
  }

  async allDependencies() {
    const dict = new Map();

    await this.editor;
    const dependencyGraph = await this.dependencyGraph();
    dependencyGraph.getAllActiveExpressions().forEach(path => {
      const dependencies = dependencyGraph.resolveDependencies(path.get("arguments")[0]);

      dependencies.forEach(statement => {
        if (!dict.get(statement)) {
          dict.set(statement, []);
        }
        dict.get(statement).push({ location: path.node.loc, source: path.get("arguments.0.body").getSource() });
      });
    });
    const map = getDependencyMapForFile(this.fileURL());
    map.forEach((aes, dependency) => {
      if(aes.length > 0) {
        const memberName = dependency.contextIdentifierValue()[1];
        let deps = dependencyGraph.resolveDependenciesForMember(memberName);
        deps.forEach(path => {
          if (!dict.get(path)) {
            dict.set(path, []);
          }
          for (const ae of aes) {
            dict.get(path).push({ location: ae._annotations._annotations[0].location, source: ae._annotations._annotations[1].sourceCode });
          }
        });
      }      
    });

    return dict;
  }

  fileURL() {
    return lively.query(this, "lively-container").getURL().pathname;
  }

  drawAExprGutter(line, dependencies) {
    this.editor.doc.setGutterMarker(line, 'activeExpressionGutter', this.drawAExprGutterMarker(dependencies));
  }

  drawAExprGutterMarker(dependencies) {
    const callback = async evt => {
      const markerBounds = evt.target.getBoundingClientRect();
      this.drawAExprDependencyList(dependencies, markerBounds);
    };

    // TODO render this without the "0"
    return <div class="activeExpressionGutter-marker" click={callback}>
      {dependencies.length}
    </div>;
  }

  async drawAExprDependencyList(dependencies, markerBounds) {
    function fa(name, ...modifiers) {
      return `<i class="fa fa-${name} ${modifiers.map(m => 'fa-' + m).join(' ')}"></i>`;
    }

    const menuItems = [];

    dependencies.forEach(dep => {
      const source = dep.source;
      const line = dep.location.start.line;
      let description = `${line}: ${source}`;
      let path = dep.location.file;
      const inThisFile = !path || path.includes(this.fileURL());
      if (inThisFile) {
        description = 'line ' + description;
      } else {
        description = path.substring(path.lastIndexOf("/") + 1) + ":" + description;
      }
      menuItems.push([description, () => {
        const start = {line: dep.location.start.line - 1, ch: dep.location.start.column}
        const end = {line: dep.location.end.line - 1, ch: dep.location.end.column}
        if(inThisFile) {
          this.editor.setSelection(start, end);
        } else {
          lively.openBrowser(path, true, start, true);
        }
        menu.remove();
      }, '→', fa(inThisFile ? 'location-arrow' : 'file-code-o')]);
    });

    const menu = await ContextMenu.openIn(document.body, { clientX: markerBounds.left, clientY: markerBounds.bottom }, undefined, document.body, menuItems);
    menu.addEventListener("DOMNodeRemoved", () => {
      this.focus();
    });
  }
}