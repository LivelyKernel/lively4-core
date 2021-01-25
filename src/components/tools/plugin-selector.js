import FileIndex from "src/client/fileindex.js";
import Morph from 'src/components/widgets/lively-morph.js';

const dataUrl = '/src/components/tools/plugin-selector-list.json';

export default class PluginSelector extends Morph {
    async initialize() {
        this.windowTitle = "PluginSelector";
        this.registerButtons()

        lively.html.registerKeys(this); // automatically installs handler for some methods

        // when created by the plugin explorer it will set this property
        this._pluginExplorer = null;

        this.listData = await this.fetchListData();
        this.displayListItems(this.listData);

        this.selectedItems = [];
        this.restoreSelection();
    }

    get workspace() {
        return this.pluginExplorer && this.pluginExplorer.workspace;
    }

    get pluginExplorer() {
        return this._pluginExplorer;
    }

    set pluginExplorer(value) {
        this._pluginExplorer = value;
        this.restoreSelection();
    }

    get pluginListElement() {
        return this.get('#pluginList');
    }

    fileNameToName(string) {
        return string.split('/').last;
    }

    listElementTo(string, list) {
        return this.pluginListElement.childNodes[list.indexOf(string)];
    }

    restoreSelection() {
        if (!this.listData || !this.workspace) {
            return;
        }
        const list = this.listData.map(url => this.fileNameToName(url));
        
        this.selectedItems = this.workspace.pluginSelection;
        for (const { url } of (this.selectedItems || [])) {
            debugger
            const listElement = this.listElementTo(this.fileNameToName(url), list);
            const button = listElement.getElementsByClassName('toggle')[0];
            button.className += ' on';
        }
    }
    
    createEntryElement(shouldColorDifferent) {
        return <div class = { 'entry' + (shouldColorDifferent ? ' contrast' : '') } > < /div>; 
    }

    createEntry(url, shouldColorDifferent) {
        const entry = this.createEntryElement(shouldColorDifferent);       

        const toggleButtonClass = 'toggle';
        const toggleButton = < button class = { toggleButtonClass } > { this.fileNameToName(url) } < /button>;
        const browseButton = < button > browse < /button>
        const editButton = < button > edit < /button>
        const input = < input class = "options" > < /input>;


        toggleButton.addEventListener('click', e => {
            // as objects get serialized and deserialized we cannot use includes
            const itemIndex = this.selectedItems.findIndex(obj => obj.url === url);
            if (itemIndex !== -1) {
                e.target.className = toggleButtonClass;
                this.selectedItems.splice(itemIndex, 1);
            } else {
                e.target.className += ' on';
                this.selectedItems.push({ url: url, options: eval(input.value) });
            }
            this.pluginExplorer.savePluginSelection(this.selectedItems);

        });

        browseButton.addEventListener('click', e => {
            lively.openBrowser(url, true);
        })

        editButton.addEventListener('click', e => {
            this.pluginExplorer.changeSelectedPlugin(url);
        })

        for (const elm of [toggleButton, browseButton, editButton, input]) {
            entry.appendChild(elm);
        }

        return entry;
    }

    displayListItems(dataList) {
        this.pluginListElement.innerHTML = '';             
        
        let shouldColorDifferent = false;
        for (const url of dataList) {
            const entry = this.createEntry(url, shouldColorDifferent);

            this.pluginListElement.appendChild(entry);
            shouldColorDifferent = !shouldColorDifferent;
        }

        const entry = this.createEntryElement(shouldColorDifferent);
              
        entry.appendChild(<button > Add Element </button>);

        entry.addEventListener('click', async (_) => {
            const urls = await lively.files.chooseFiles(lively4url + "/");
            this.listData.push(...urls);
            this.listData.sort();
            this.saveListData();
            this.displayListItems(this.listData);
        })

        this.pluginListElement.appendChild(entry);
    }

    /*MD # Load and save list-data MD*/

    fullUrl(urlString) {
        try {
            return lively.paths.normalizePath(urlString, "");
        } catch (e) {
            return null;
        }
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

    async saveListData() {
        const contents = JSON.stringify(this.listData);
        this.saveFile(dataUrl, contents);
    }

    async fetchListData() {
        const list = await this.loadFile(dataUrl);

        return JSON.parse(list);
    }


    /*MD # Lively Support MD*/
    /* Lively-specific API */

    // store something that would be lost
    livelyPrepareSave() {

    }

    livelyPreMigrate() {
        // is called on the old object before the migration
    }

    livelyMigrate(other) {
        // whenever a component is replaced with a newer version during development
        // this method is called on the new object during migration, but before initialization

    }

    livelyInspect(contentNode, inspector) {
        // do nothing
    }

}
