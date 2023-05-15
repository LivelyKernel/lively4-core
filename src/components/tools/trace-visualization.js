import babelDefault from 'src/external/babel/babel7default.js';
const babel = babelDefault.babel;
import Trace from 'demos/tom/trace.js';

import Morph from 'src/components/widgets/lively-morph.js';

export default class TraceVisualization extends Morph {
  async initialize() {
    this.windowTitle = "TraceVisualization";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods


    this.currentURL = null;
    this.textManuallyChanged = false;

    // declare variables used later on for documentation
    this.trace;
    this.curAST;
    this.nextAST;

    this.entries = [];

    let debounced = _.debounce(() => {
      const selection = this.editor.currentEditor().listSelections()[0];
      const position = {
        filename: this.currentURL,
        startLine: selection.anchor.line,
        endLine: selection.head.line,
        startColumn: selection.anchor.ch,
        endColumn: selection.head.ch
      };
      this.markInRange(position);
    }, 500);

    const cm = await this.editor.awaitEditor();

    cm.on("beforeSelectionChange", () => {
      debounced.cancel();
      debounced();
    });
  }
  
  static async for(source, pluginData) {
    const trace = await Trace.on(source, pluginData);
    const selector = await lively.openComponentInWindow('trace-visualization');
    selector.visualize(trace);
  }

  visualize(trace) {
    this.trace = trace;
    this.updateList();
    this.setCurrentAST(trace.oldAST);
  }

  /*MD ## UI access MD*/

  get traceList() {
    return this.get('#traceList');
  }

  get editor() {
    return this.get('#editor');
  }

  get currentAST() {
    return this.get('#currentAst');
  }

  get transformedAst() {
    return this.get('#transformedAst');
  }

  get editorDoc() {
    return this.editor.currentEditor();
  }

  async onShowAst() {
    if (!this.comparison) {
      this.comparison = await lively.openComponentInWindow('lively-ast-comparison');
    }
    this.comparison.updateView(this.curAST, this.nextAST);
  }

  async setEditorURL(newURL) {
    if (this.currentURL !== newURL || this.textManuallyChanged) {
      this.editor.setURL(newURL);
      this.currentURL = newURL;
      await this.editor.loadFile();
      this.textManuallyChanged = false;
    }
  }
  /*MD ## Update list MD*/

  clearList() {
    this.traceList.innerHTML = '';
  }

  markAndScrollTo(position) {
    this.editorDoc.scrollIntoView({
      line: position.startLine - 1,
      ch: position.startColumn
    }, 200);

    this.lastMark = this.editorDoc.markText({
      line: position.startLine - 1,
      ch: position.startColumn
    }, {
      line: position.endLine - 1,
      ch: position.endColumn
    }, {
      css: 'background: #eee'
    });
  }

  setSubEntryEventListener(subEntry, element, path) {
    subEntry.addEventListener('mouseover', async e => {
      // prevent outer mouseover listener to overwrite this action
      e.stopPropagation();

      if (this.lastMark) {
        this.lastMark.clear();
      }

      this.updateASTs(path, element);

      if (element.position) { 
        const position = this.trace.resolve(element.position);
        if (position) {
          await this.setEditorURL(position.filename);
          this.markAndScrollTo(position);
        }
      }
    });

    subEntry.addEventListener('dblclick', e => {
      element.openInInspector()
    })
  }

  createSectionElement(section, path = []) {
    const className = `entry ${section.hasChanges ? 'changing' : ''}`
    const header = < div class = { className } > +{ section.name } < /div>;
    const body = < div > < /div>;
    const entry = < div > { header } { body } < /div>;

    entry.data = {};
    entry.data.traverse = function(fn) {
      fn(header, section);
      for (const child of body.children) {
        child.data.traverse(fn);
      }
    }


    let isTriggered = false;

    header.addEventListener('click', e => {
      header.innerText = `${isTriggered ? '+' : '-'} ${section.name}`;
      const me = this;
      if (!isTriggered) {
        for (const element of section.entries) {
          element.visit({
            visitEvent(event) {
              const className = `entry sub ${element.hasChanges ? 'changing' : ''}`;
              const subEntry = < div class = { className } > { event.type } < /div>;

              subEntry.data = {};
              subEntry.data.traverse = function(fn) {
                fn(subEntry, element);
              }

              body.appendChild(subEntry);
              me.setSubEntryEventListener(subEntry, element, [...path, section]);
            },
            visitErrorEvent(errorEvent) {
              const className = `entry sub ${element.hasChanges ? 'changing' : ''}`;
              const subEntry = < div class = { className } style =
                "background: red; color: #eee" > { errorEvent.type } < /div>;

              subEntry.data = {};
              subEntry.data.traverse = function(fn) {}

              body.appendChild(subEntry);
              subEntry.addEventListener('mouseover', e => {
                me.editor.setText(errorEvent.data[0]);
                me.textManuallyChanged = true;
              });
            },
            visitTraceSection(traceSection) {
              const subEntry = me.createSectionElement(traceSection, [...path, section]);
              subEntry.className += ' sub';

              body.appendChild(subEntry);
            }
          });
        }
      } else {
        body.innerHTML = '';
      }
      isTriggered = !isTriggered;

    });

    this.setSubEntryEventListener(header, section, path);

    entry.select = function() {
      section.position
    }

    return entry;
  }

  addListItem(section) {
    const entry = this.createSectionElement(section);

    this.entries.push(entry);
    this.traceList.appendChild(entry);
  }

  updateList() {
    this.entries = [];
    this.clearList();
    for (const section of this.trace.sections) {
      this.addListItem(section);
    }
  }

  /*MD ## Highlighting MD*/
  isInRange(given, toTest) {
    if (given.filename !== toTest.filename) {
      return false;
    }

    if (given.startLine >= toTest.startLine && given.endLine <= toTest.endLine) {
      if (given.startLine === toTest.startLine && given.startColumn < toTest.startColumn) {
        return false;
      }

      if (given.endLine === toTest.endLine && given.endColumn > toTest.endColumn) {
        return false;
      }

      return true;
    }

    return false;
  }

  markInRange(position) {
    for (const entry of this.entries) {
      entry.data.traverse((element, item) => {
        if (!item.position) {
          return;
        }
        if (this.isInRange(position, this.trace.resolve(item.position))) {
          element.classList.add('marked');
        }
      })
    }
  }

  /*MD ## Update AST MD*/

  setCurrentAST(ast) {
    this.currentAST.value = babel.transformFromAst(ast).code;
  }

  setTransformedAST(ast) {
    this.transformedAst.value = babel.transformFromAst(ast).code;
  }

  showASTs() {
    this.setCurrentAST(this.curAST);
    this.setTransformedAST(this.nextAST);

    if (this.comparison) {
      this.comparison.updateView(this.curAST, this.nextAST);
    }
  }

  walkPath(path, ast) {
    let entries = this.trace.sections;

    for (const part of path) {
      for (const entry of entries) {
        if (entry === part) {
          break;
        }
        entry.apply(ast);
      }
      entries = part.entries;
    }

    return entries;
  }

  updateASTs(path, entry) {
    this.curAST = JSON.parse(JSON.stringify(this.trace.oldAST));

    const entries = this.walkPath(path, this.curAST);
    const index = entries.indexOf(entry);

    for (let i = 0; i < index; i++) {
      entries[i].apply(this.curAST);
    }

    this.nextAST = JSON.parse(JSON.stringify(this.curAST));
    entries[index].apply(this.nextAST);
    this.showASTs();
  }


  /*MD ## Lively-specific API MD*/

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value)
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.visualize(other.trace);
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  async livelyExample() {
    const source =
      `"enable aexpr";
        import * as u from "utils";

        //debugger;
        var a = 0;
        aexpr(() => a).onChange(v => lively.notify(v))
        a = 2;
        lively.notify("123");`

    const plugins = [{ url: "https://lively-kernel.org/lively4/lively4-tom/src/client/reactive/babel-plugin-active-expression-rewriting/index.js" }];

    TraceVisualization.for(source, plugins)
  }


}
