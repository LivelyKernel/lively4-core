import Morph from 'src/components/widgets/lively-morph.js';
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import SyntaxChecker from 'src/client/syntax.js'
import sourcemap from 'src/external/source-map.min.js'
import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent } from 'utils';


function babelVisitorWrapper(key, nodeType, visitor) {
    return function(...args) {
        console.log(args[0])
        console.log(nodeType, key);
        visitor(...args);
    }
}

class Transitions {
    constructor() {
        this._transitions = [];
        this.savedTransitions = [];
        this.selectionTookPlace = false;
        this.errorState = null;
    }

    _getProgramParent(path) {
        let parent = path;
        do {
            if (parent.isProgram()) return parent;
        } while ((parent = parent.parentPath));
    };

    getValue() {
        return this._transitions;
    };

    addEntryTransition(code) {
        this._transitions.push({
            code,
            alias: "Original",
            type: "entry",
            size: new Blob([code], { type: "text/plain" }).size
        })
    }

    addExitTransition(code) {
        this._transitions.push({
            code,
            alias: "output",
            type: "exit",
            size: new Blob([code], { type: "text/plain" }).size
        });
    };

    wrapPluginVisitorMethod(pluginAlias, visitorType, callback) {
        return (...args) => {
            try {
                callback.call(this, ...args);

            this.savedTransitions.push({
                node: JSON.parse(JSON.stringify((args[0].node))),
                parent: _.cloneDeep(this._getProgramParent(args[0]).node),
                alias: pluginAlias,
                type: visitorType
            })
            } catch(e) {
                this.errorState = {
                    error: e,
                    alias: pluginAlias,
                    type: visitorType
                };
                // still want the normal error handling of the plugin explorer
                throw e;
            }
        };
    };

    selectTransitionsIfNecessary() {
        if (!this.selectionTookPlace) {
            for (const transition of this.savedTransitions) {
                const { code } = babel.transformFromAst(transition.parent);
                if (this._transitions.length === 0 || this._transitions[this._transitions.length - 1].code !== code) {
                    this._transitions.push({
                        code,
                        alias: transition.alias,
                        type: transition.type,
                        currentNode: transition.node.type,
                        size: new Blob([code], { type: "text/plain" }).size
                    });
                }
            }
            if (this.errorState !== null) {
                this._transitions.push({
                    code: this.errorState.error.stack,
                    alias: this.errorState.alias,
                    type: this.errorState.type
                })
            }
            this.selectionTookPlace = true;
        }
    }
}

export default class PluginExplorer extends Morph {

    static get defaultPluginURL() { return lively4url + "/src/components/tools/lively-ast-explorer-example-plugin.js"; }

    static get defaultWorkspacePath() { return "/src/components/tools/lively-plugin-explorer-playground.workspace"; }

    /*MD ## UI Accessing MD*/

    get container() { return this.get("#content"); }

    get executionConsole() { return this.get("#executionConsole"); }

    get sourceLCM() { return this.get("#source"); }
    get sourceCM() { return this.sourceLCM.editor; }
    get sourceText() { return this.sourceCM.getValue(); }

    get sourceAstInspector() { return this.get("#sourceAst"); }

    get transformedAstInspector() { return this.get("#transformedAst"); }


    get pluginEditor() { return this.get("#plugin"); }
    get pluginLCM() { return this.pluginEditor.livelyCodeMirror(); }
    get pluginCM() { return this.pluginEditor.currentEditor(); }
    get pluginSource() { return this.pluginCM.getValue(); }

    async getPlugin(url = this.pluginURL) {
        url = this.fullUrl(url) || "";
        const module = await System.import(url);

        // we know no better way to get the plugin-file now, so we append the path to it to the name
        // and can read it from there later on
        const plugin =  module.default;
        const modifiedPlugin = function(...args) {
            const result = plugin(...args)
            result.name = result.name || 'Please name your plugin!';
            result.name += ' ' + url 
            return result;
        }
        
        return modifiedPlugin;
    }

    get transformedSourceLCM() { return this.get("#transformedSource"); }
    get transformedSourceCM() { return this.transformedSourceLCM.editor; }
    get transformedSourceText() { return this.transformedSourceCM.getValue(); }

    get pluginURL() { return this.pluginEditor.getURLString(); }

    get workspacePathInput() { return this.get("#workspace-path"); }
    get workspaceURL() { return this.workspacePathInput.value; }
    set workspaceURL(urlString) { this.workspacePathInput.value = urlString; }
    onWorkspacePathInputEntered(urlString) { this.loadWorkspaceFile(urlString); }

    /*MD ## Workspace Options MD*/

    get saveWorkspaceButton() { return this.get("#saveWorkspace"); }
    get autoSaveWorkspace() { return false; } //TODO
    set autoSaveWorkspace(bool) {
        this.saveWorkspaceButton.classList.toggle("on", bool);
    }
    onSaveWorkspace(evt) {
        if (evt.button === 2) {
            this.toggleOption("autoSaveWorkspace");
        } else {
            this.saveWorkspace();
        }
    }

    get updateASTButton() { return this.get("#updateAST"); }
    get autoUpdateAST() { return this.getOption("autoUpdateAST"); }
    set autoUpdateAST(bool) {
        this.updateASTButton.classList.toggle("on", bool);
        this.updateASTButton.querySelector("i").classList.toggle("fa-spin", bool);
    }
    onUpdateAST(evt) {
        if (evt.button === 2) {
            this.toggleOption("autoUpdateAST");
        } else {
            this.updateAST();
        }
    }

    get updateTransformationButton() { return this.get("#updateTransformation"); }
    get autoUpdateTransformation() { return this.getOption("autoUpdateTransformation"); }
    set autoUpdateTransformation(bool) {
        this.updateTransformationButton.classList.toggle("on", bool);
        this.updateTransformationButton.querySelector("i").classList.toggle("fa-spin", bool);
    }
    onUpdateTransformation(evt) {
        if (evt.button === 2) {
            this.toggleOption("autoUpdateTransformation");
        } else {
            this.updateTransformation();
        }
    }

    get runTestsButton() { return this.get("#runTests"); }
    get autoRunTests() { return this.getOption("autoRunTests"); }
    set autoRunTests(bool) {
        this.runTestsButton.classList.toggle("on", bool);
    }
    onRunTests(evt) {
        if (evt.button === 2) {
            this.toggleOption("autoRunTests");
        } else {
            this.runTests();
        }
    }

    get executeButton() { return this.get("#execute"); }
    get autoExecute() { return this.getOption("autoExecute"); }
    set autoExecute(bool) {
        this.executeButton.querySelector("i").classList.toggle("fa-spin", bool);
        this.executeButton.classList.toggle("on", bool);
    }
    onExecute(evt) {
        if (evt.button === 2) {
            this.toggleOption("autoExecute");
        } else {
            this.execute();
        }
    }

    get systemJSButton() { return this.get("#toggleSystemJS"); }
    get systemJS() { return this.getOption("systemJS"); }
    set systemJS(bool) {
        this.systemJSButton.classList.toggle("on", bool);
    }
    onToggleSystemJS() { this.toggleOption("systemJS"); }

    /*MD ## Options MD*/

    setOption(option, value) {
        this.workspace.options[option] = value;
        this[option] = value;
    }

    getOption(option) {
        if (option in this.workspace.options) {
            return this.workspace.options[option];
        } else {
            return this.optionDefaults[option];
        }
    }

    toggleOption(option) {
        this.setOption(option, !this.getOption(option));
    }

    loadOptions(options) {
        for (const [option, value] of Object.entries(options)) {
            this.setOption(option, value);
        }
    }

    initOptions() {
        for (const [option, value] of Object.entries(this.optionDefaults)) {
            this[option] = value;
        }
    }

    get optionDefaults() {
        return {
            "systemJS": false,
            "autoExecute": true,
            "autoRunTests": false,
            "autoUpdateAST": true,
            "autoUpdateTransformation": true,
            "autoSaveWorkspace": true,
        }
    }

    /*MD ## Initialization MD*/

    fullUrl(urlString) {
        try {
            return lively.paths.normalizePath(urlString, "");
        } catch (e) {
            return null;
        }
    }

    async initialize() {
        this.windowTitle = "Plugin Explorer";
        this.registerButtons();

        this.workspace = {
            options: {}
        };

        this.initOptions();

        this.getAllSubmorphs("button").forEach(button => {
            button.addEventListener('contextmenu', e => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.dispatchEvent(new MouseEvent("click", { button: 2 }));
            });
        });

        this.debouncedUpdateAST = this.updateAST::debounce(500);
        this.debouncedUpdateTransformation = this.updateTransformation::debounce(500);

        function enableSyntaxCheckForEditor(editor) {
            editor.addEventListener("change", (evt => SyntaxChecker.checkForSyntaxErrors(editor.editor))::debounce(
                200));
        }

        this.pluginEditor.awaitEditor().then(() => {
            this.pluginEditor.hideToolbar();
            this.pluginLCM.doSave = async () => {
                await this.pluginEditor.saveFile();

                await lively.reloadModule("" + this.pluginURL);
                this.updateAST();
            };
            enableSyntaxCheckForEditor(this.pluginLCM);
            // this.pluginLCM.addEventListener("change", evt => {if (this.autoUpdate) this.debouncedUpdateTransformation()});
            this.transformedSourceCM.on("beforeSelectionChange", evt => this.onTransformedSourceSelectionChanged(
                evt));
        });

        this.sourceLCM.editorLoaded().then(() => {
            this.sourceAstInspector.connectLivelyCodeMirror(this.sourceLCM);
            this.sourceLCM.doSave = async () => {
                // TODO: Save source
                this.updateAST();
            };
            enableSyntaxCheckForEditor(this.sourceLCM);
            this.sourceLCM.addEventListener("change", evt => { if (this.autoUpdateAST) this.debouncedUpdateAST() });
            this.sourceCM.on("beforeSelectionChange", evt => this.onSourceSelectionChanged(evt));
        });

        this.workspacePathInput.addEventListener("keyup", evt => {
            if (evt.code == "Enter") this.onWorkspacePathInputEntered(this.workspacePathInput.value);
        });

        await Promise.all([
            this.pluginEditor.awaitEditor(),
            this.sourceLCM.editorLoaded(),
            this.transformedSourceLCM.editorLoaded().then(() => {
                this.transformedAstInspector.connectLivelyCodeMirror(this.transformedSourceLCM);
                this.transformedSourceLCM.doSave = async () => {
                    // TODO: Save source
                    this.updateTransformedAST();
                };
            }),
        ]);

        this.dispatchEvent(new CustomEvent("initialize"));
    }

    async loadFile(urlString) {
        try {
            const url = new URL(this.fullUrl(urlString));
            const response = await fetch(url);
            return response.text();
        } catch (e) {
            lively.error(`Failed to load file '${urlString}'`);
            return null;
        }
    }

    async saveFile(urlString, contents) {
        try {
            const url = new URL(this.fullUrl(urlString));
            await fetch(url, {
                method: 'PUT',
                body: contents,
            });
        } catch (e) {
            lively.error(`Failed to save file '${urlString}'`);
        }
    }

    async loadWorkspaceFile(urlString) {
        try {
            const text = await this.loadFile(urlString);
            const ws = JSON.parse(text);
            this.workspacePathInput.value = urlString;
            this.loadWorkspace(ws);
        } catch (e) {
            lively.error(`Failed to load workspace '${urlString}'`);
        }
    }
    
    loadPluginFile(url) {
        this.pluginEditor.setURL(url);
        this.pluginEditor.loadFile();
    }
    
    changeSelectedPlugin(url) {
        this.workspace.plugin = url;
        this.saveWorkspaceFile(this.workspaceURL);
        this.loadPluginFile(this.workspace.plugin);
    }

    async loadWorkspace(ws) {
        this.workspace = ws;
        this.loadOptions(ws.options);
        this.loadPluginFile(new URL(this.fullUrl(ws.plugin)));
        //TODO
        this.sourceLCM.value = ""; //new URL(this.fullUrl(ws.source))
    }

    async saveWorkspaceFile(urlString) {
        try {
            const text = JSON.stringify(this.workspace);
            this.saveFile(urlString, text);
        } catch (e) {
            lively.error(`Failed to save workspace '${urlString}'`);
        }
    }

    async saveWorkspace() {
        this.pluginEditor.saveFile();
        this.saveWorkspaceFile(this.workspaceURL);
    }
    
    /*MD # Plugin selection MD*/
    
    
    onSelectPlugins() {
        lively.openComponentInWindow('plugin-selector')  
            .then(elm => elm.pluginExplorer = this);
    }
    
    savePluginSelection(selection) {
        this.workspace.pluginSelection = selection;
        this.saveWorkspace();
    }
    /*MD ## Execution MD*/

    async updateAST() {
        try {
            let ast = this.sourceText.toAST();
            this.sourceAstInspector.inspect(ast);
            if (this.autoUpdateTransformation) this.updateTransformation(ast);
        } catch (e) {
            this.sourceAstInspector.inspect({ Error: e.message });
        }
        this.updateTransformedAST();
    }

    async updateTransformedAST() {
        try {
            let ast = this.transformedSourceText.toAST();
            this.transformedAstInspector.inspect(ast);
        } catch (e) {
            this.transformedAstInspector.inspect({ Error: e.message });
        }
    }

    replaceButtonsWith(buttons) {
        const pane = this.get('#buttonPane');
        pane.innerHTML = '';
        for (const button of buttons) {
            pane.appendChild(button);
        }
    }

    updateAndExecute(code) {
        this.transformedSourceLCM.value = code;

        if (this.autoExecute) this.execute();
        if (this.autoRunTests) runTests();
    }

    setTransitionButtons(transitions) {
        this.replaceButtonsWith(transitions.getValue().map((transition, index) => {
            const nameComponents = transition.alias.split(' ');
            let buttonContent = transition.alias;
            let path = null;
            if (nameComponents.length > 1) {
                buttonContent = nameComponents.slice(0, -1).join(' ');
                path = nameComponents.last;
            }
            
            const button = document.createElement('button');
            button.innerText = `${index}: ${buttonContent}`;
            button.addEventListener('click', e => {
                // transition.inspect()
                if(path) {
                    lively.openBrowser(path);
                }
            });
            button.addEventListener('mouseover', e => {
                this.updateAndExecute(transition.code);
            });
            return button;
        }))
    }

    async updateTransformation(ast) {
        let transitions = new Transitions();
        transitions.addEntryTransition(this.sourceText);

        try {
            console.group("PLUGIN TRANSFORMATION");
            if (!ast) return;
            /*if (this.systemJS) {
                // use SystemJS config do do a full transform
                if (!self.lively4lastSystemJSBabelConfig) {
                    lively.error("lively4lastSystemJSBabelConfig missing");
                    return;
                }
                let config = Object.assign({}, self.lively4lastSystemJSBabelConfig);
                let url = this.fullUrl(this.pluginURL) || "";
                let originalPluginURL = url.replace(/-dev/, ""); // name of the original plugin .... the one without -dev
                // replace the original plugin with the one under development.... e.g. -dev
                config.plugins = config.plugins.filter(ea => !ea.livelyLocation || !(ea.livelyLocation ==
                        originalPluginURL))
                    .concat([plugin])
                let filename = "tempfile.js";
                config.filename = filename
                config.sourceFileName = filename
                config.moduleIds = false
                config.wrapPluginVisitorMethod = transitions.wrapPluginVisitorMethod.bind(transitions);
                this.transformationResult = babel.transform(this.sourceText, config);
            } else {
                this.transformationResult = ast.transformAsAST(plugin, {
                    wrapPluginVisitorMethod: transitions.wrapPluginVisitorMethod
                        .bind(transitions)
                });
            }*/
            
            
            
            const config = {};
            const selection = this.workspace.pluginSelection;
            config.plugins = await Promise.all(selection.map(({url}) => this.getPlugin(url)));
            
            const filename = 'tempfile.js';
            config.sourceFileName = filename
            config.moduleIds = false;
            
            config.wrapPluginVisitorMethod = transitions.wrapPluginVisitorMethod.bind(transitions);
            this.transformationResult = babel.transform(this.sourceText, config);
            

            // Todo: find in original code how to use
            // transitions.addExitTransition(this.transformationResult.code);

            this.updateAndExecute(this.transformationResult.code);

            transitions.selectTransitionsIfNecessary();
            transitions.addExitTransition(this.transformationResult.code);
        } catch (e) {
            console.error(e);
            this.transformedSourceLCM.value = e.stack;
        } finally {
            console.groupEnd();
            transitions.selectTransitionsIfNecessary();
            this.setTransitionButtons(transitions);
        }
    }

    async execute() {
        const log = this.executionConsole;
        log.innerHTML = "";
        log.textContent = "";

        const oldLog = console.log
        try {
            console.group("[Plugin Explorer] EXECUTE REWRITTEN FILE");
            console.log = (...fragments) => {
                oldLog.call(console, ...fragments)
                log.textContent += fragments.join(', ') + "\n"
            }
            // #TODO active expressions...
            var transformedSource = this.transformedSourceCM.getValue()
            if (this.systemJS) {
                // use systemjs to load it's module without any further transformation
                var url = "tmp://" + filename // replace this with local TMP 

                var modURL = lively.swxURL(url)
                await lively.unloadModule(modURL)
                await fetch(url, {
                    method: "PUT",
                    body: transformedSource
                })
                await System.import(modURL)
            } else {
                var result = '' + (await this.transformedSourceLCM.boundEval(transformedSource)).value;
            }

            // var result ='' + eval(this.outputEditor.editor.getValue());
            this.executionConsole.textContent += "-> " + result;
        } catch (e) {
            console.error(e);
            this.executionConsole.textContent += e.stack;
        } finally {
            console.log = oldLog
            console.groupEnd();
        }
    }

    runTests() {
        executeAllTestRunners();
    }

    /*MD ## Mapping Sources MD*/

    originalPositionFor(line, column) {
        var smc = new sourcemap.SourceMapConsumer(this.transformationResult.map)
        return smc.originalPositionFor({
            line: line,
            column: column
        })
    }

    generatedPositionFor(line, column) {
        if (!this.transformationResult || !this.transformationResult.map) return;
        var smc = new sourcemap.SourceMapConsumer(this.transformationResult.map)
        return smc.generatedPositionFor({
            source: "tempfile.js",
            line: line,
            column: column
        });
    }

    mapEditorsFromToPosition(fromTextEditor, toTextEditor, backward) {
        if (backward == true) {
            var method = "originalPositionFor"
        } else {
            method = "generatedPositionFor"
        }
        var range = fromTextEditor.listSelections()[0]
        var start = this[method](range.anchor.line + 1, range.anchor.ch + 1)
        var end = this[method](range.head.line + 1, range.head.ch + 1)

        //lively.notify(`start ${range.anchor.line} ch ${range.anchor.ch} ->  ${start.line} ch ${start.column} / end ${range.head.line} ch ${range.head.ch} -> ${end.line} c ${end.column}`)
        if (!start || !end) return;

        toTextEditor.setSelection({ line: start.line - 1, ch: start.column - 1 }, {
            line: end.line - 1,
            ch: end.column -
                1
        })
    }

    onSourceSelectionChanged(evt) {
        setTimeout(() => {
            if (this.sourceLCM.isFocused()) {
                this.mapEditorsFromToPosition(
                    this.sourceCM, this.transformedSourceCM, false)
            }
        }, 0);
    }
    onTransformedSourceSelectionChanged(evt) {
        setTimeout(() => {
            if (this.transformedSourceLCM.isFocused()) {
                this.mapEditorsFromToPosition(
                    this.transformedSourceCM, this.sourceCM, true)
            }
        }, 0);
    }

    /*MD ## Lively Integration MD*/

    livelyPrepareSave() {
        this.setAttribute('workspace', BabelWorkspace.serialize(this.workspace));
        console.log("PREPARE SAVE (Plugin Explorer)");
    }

    livelyMigrate(other) {
        // #TODO: do we still need this?
        this.addEventListener("initialize", () => {
            this.loadWorkspace(other.workspace);
            this.sourceCM.setValue(other.sourceText);
            this.transformedSourceCM.setValue(other.transformedSourceCM.getValue());
            this.transformationResult = other.transformationResult;
            this.runsTests = other.runTests;
            this.updateAST();
        });
    }

    livelyExample() {
        this.loadWorkspaceFile(PluginExplorer.defaultWorkspacePath);
    }
}

class Source {
    get name() {
        return this._name;
    }

    set name(str) {
        return this._name = str;
    }
}

class LocalSource extends Source {
    constructor() {
        super();
    }

    async getContent() {
        return this.content || "";
    }

    async setContent(str) {
        this.content = str;
    }
}

class FileSource extends Source {
    constructor() {
        super();
    }

    fullUrl() {
        const normalizedPath = lively.paths.normalizePath(this.url, "");
        return new URL(normalizedPath);
    }

    async getContent() {
        try {
            const url = this.fullUrl();
            const response = await fetch(url);
            return response.text();
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async setContent(text) {
        try {
            const url = this.fullUrl();
            const response = await fetch(url, {
                method: 'PUT',
                body: text,
            });
            return response.ok;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    get name() {
        return this._name || this.url;
    }
}

class BabelWorkspace {
    static deserialize(json) {
        return JSON.parse(json, ([key, value]) => {
            if (value.type === "local") {
                return Object.assign(new LocalSource(), value);
            } else if (value.type === "file") {
                return Object.assign(new FileSource(), value);
            }
            return value;
        });
    }

    static serialize(ws) {
        return JSON.stringify(ws);
    }
}
