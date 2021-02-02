import loadPlugin from 'demos/tom/plugin-load-promise.js'
import Trace from 'demos/tom/trace.js';
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import Morph from 'src/components/widgets/lively-morph.js';

export default class TraceVisualization extends Morph {
    async initialize() {
        this.windowTitle = "TraceVisualization";
        this.registerButtons()

        lively.html.registerKeys(this); // automatically installs handler for some methods


        this.currentURL = null;
        
        // declare variables used later on for documentation
        this.trace;
        this.curAST;
        this.nextAST;
    }

     
    static async for (source, pluginUrls) {
            const trace = await Trace.on(source, pluginUrls);
            const selector = await lively.openComponentInWindow('trace-visualization');
            selector.visualize(trace);
        }

    visualize(trace) {
        this.trace = trace;
        this.updateList();
        this.setCurrentAST(trace.oldAST);
    }

    /* UI access */

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
        if(!this.comparison) {
            this.comparison = await lively.openComponentInWindow('lively-ast-comparison');
        }        
        this.comparison.updateView(this.curAST, this.nextAST);
    }

    /* update List */

    clearList() {
        this.traceList.innerHTML = '';
    }
    
    setSubEntryEventListener(subEntry, elm, path) {
        subEntry.addEventListener('mouseover', async e => {
            // prevent outer mouseover listener to overwrite this action
            e.stopPropagation();

            if (this.lastMark) {
                this.lastMark.clear();
            }

            this.updateAST(path, elm);

            const position = this.trace.resolve(elm.position);
            if(!position) {
                return;
            }
            if (this.currentURL !== position.filename) {
                this.editor.setURL(position.filename);
                this.currentURL = position.filename;
                await this.editor.loadFile();
            }

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
        });
    }
    
    createSectionElement(section, path = [section]) {
        const className = `entry ${section.hasChanges ? 'changing' : ''}`
        const header = < div class = { className } > + { section.name } < /div>;
        const body = < div > < /div>;
        const entry = < div > { header } { body } < /div>;


        let isTriggered = false;

        header.addEventListener('click', e => {
            header.innerText = `${isTriggered ? '+' : '-'} ${section.name}`;
            const me = this;
            if (!isTriggered) {
                for (const elm of section.entries) {
                    elm.visit({
                        visitEvent(event) {
                            const className = `entry sub ${elm.hasChanges ? 'changing' : ''}`;
                            const subEntry = < div class = { className } > { event.type } < /div>;

                            body.appendChild(subEntry);        
                            me.setSubEntryEventListener(subEntry, elm, path);
                        },
                        visitErrorEvent(errorEvent) {
                            const className = `entry sub ${elm.hasChanges ? 'changing' : ''}`;
                            const subEntry = < div class = { className } style="background: red; color: #eee" > { errorEvent.type } < /div>;

                            body.appendChild(subEntry);        
                            subEntry.addEventListener('mouseover', e => {
                                me.editor.value = errorEvent.data;
                            }); 
                        },
                        visitTraceSection(traceSection) {
                            const subEntry = me.createSectionElement(traceSection, [...path, traceSection]);
                            subEntry.className += ' sub';
                            
                            body.appendChild(subEntry);
                            
                            const header = subEntry.children[0];
                            me.setSubEntryEventListener(header, elm, path);
                        }
                    });
                }
            } else {
                body.innerHTML = '';
            }
            isTriggered = !isTriggered;

        });
                                      
        return entry;
    }

    addListItem(section) {
        const entry = this.createSectionElement(section);

        this.traceList.appendChild(entry);
    }

    updateList() {
        this.clearList();
        for (const section of this.trace.sections) {
            this.addListItem(section);
        }
    }

    /* update AST */

    setCurrentAST(ast) {
        // this.currentAST.inspect(ast);
        this.currentAST.value = babel.transformFromAst(ast).code
    }

    setTransformedAST(ast) {
        // this.transformedAst.inspect(ast);
                                          
        this.transformedAst.value = babel.transformFromAst(ast).code
    }

    showASTs() {
        this.setCurrentAST(this.curAST);
        this.setTransformedAST(this.nextAST);
                                          
        if(this.comparison) {
            this.comparison.updateView(this.curAST, this.nextAST);
        }
    }
                                      
    updateAST(path, entry) {
        this.curAST = JSON.parse(JSON.stringify(this.trace.oldAST));
        this.nextAST;
        
        let entries = this.trace.sections;
                                          
        for (const part of path) {
            for (const entry of entries) {
                if(entry === part) {
                    break;
                }
                entry.apply(this.curAST)
            }
            entries = part.entries;
        }

        const index = entries.indexOf(entry);

        for (let i = 0; i < index; i++) {
            entries[i].apply(this.curAST);
        }

        this.nextAST = JSON.parse(JSON.stringify(this.curAST));
        entries[index].apply(this.nextAST);
        this.showASTs();
    }


    /* Lively-specific API */

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

    }


}
