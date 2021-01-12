import loadPlugin from 'demos/tom/plugin-load-promise.js'
import Trace from 'demos/tom/trace.js';

import Morph from 'src/components/widgets/lively-morph.js';

export default class TraceVisualization extends Morph {
    async initialize() {
        this.windowTitle = "TraceVisualization";
        this.registerButtons()

        lively.html.registerKeys(this); // automatically installs handler for some methods


        this.currentURL = null;

    }
    
    static async for(source, pluginUrls) {
        const trace = await Trace.on(source, pluginUrls);
        const selector = await lively.openComponentInWindow('trace-visualization');
        selector.visualize(trace);
    }

    visualize(trace) {
        this.trace = trace;
        this.updateList();
        this.showCurrentAST();
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

    /* update List */

    clearList() {
        this.traceList.innerHTML = '';
    }

    addListItem(section) {
        const className = `entry ${section.hasChanges ? 'changing' : ''}`
        const header = < div class = {className} > +{ section.name } < /div>;
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
                            const subEntry = < div class = {className} > { event.type } < /div>;

                            body.appendChild(subEntry);

                            subEntry.addEventListener('mouseover', async e => {
                                if (me.lastMark) {
                                    me.lastMark.clear();
                                }

                                const position = elm.position;
                                if (me.currentURL !== position.filename) {
                                    me.editor.setURL(position.filename);
                                    await me.editor.loadFile();
                                }
                                          
                                me.editorDoc.scrollIntoView({
                                    line: position.startLine - 1,
                                    ch: position.startColumn
                                });

                                me.lastMark = me.editorDoc.markText({
                                    line: position.startLine - 1,
                                    ch: position.startColumn
                                }, {
                                    line: position.endLine - 1,
                                    ch: position.endColumn
                                }, {
                                    css: 'background: #eee'
                                });
                            });
                        },
                        visitASTChangeEvent(ASTChangeEvent) {

                        },
                        visitTraceSection(traceSection) {
                            subEntry.innerText = 'Section' + traceSection.name;
                        }
                    });


                }
            } else {
                body.innerHTML = '';
            }
            isTriggered = !isTriggered;

        });

        this.traceList.appendChild(entry);
    }

    updateList() {
        this.clearList();
        for (const section of this.trace.sections) {
            this.addListItem(section);
        }
    }

    /* update AST */
    showCurrentAST() {
        this.currentAST.inspect(this.trace.oldAST);
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
        this.someJavaScriptProperty = other.someJavaScriptProperty
    }

    livelyInspect(contentNode, inspector) {
        // do nothing
    }

    async livelyExample() {
        const source = `if(true){}`;
        const urls = ['https://lively-kernel.org/lively4/lively4-tom/demos/tom/defect-demo-plugin.js'];
                                          
        const trace = await Trace.on(source, urls);
                                          
        this.visualize(trace);
    }


}
