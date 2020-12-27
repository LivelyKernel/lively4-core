import FileIndex from "src/client/fileindex.js";
import Morph from 'src/components/widgets/lively-morph.js';

const pluginPrefix = 'babel-plugin-';

export default class PluginSelector extends Morph {
    async initialize() {
        this.windowTitle = "PluginSelector";
        this.registerButtons()

        lively.html.registerKeys(this); // automatically installs handler for some methods
        
        // when created by the plugin explorer it will set this property
        this._pluginExplorer = null;

        this.listData = await this.fetchListData();
        this.displayListItems(this.listData.map(item => item.url));
        
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
        return string.split('/').last.slice(pluginPrefix.length);
    }
    
    listElementTo(string, list) {
        return this.pluginListElement.childNodes[list.indexOf(string)];
    }
    
    restoreSelection() {
        if(!this.listData || !this.workspace) {
            return;
        }
        const list = this.listData.map(node => this.fileNameToName(node.name))
        this.selectedItems = this.workspace.pluginSelection;
        for (const {url} of (this.selectedItems || [])) {
            const listElement = this.listElementTo(this.fileNameToName(url), list);
            const button = listElement.childNodes[0];
            button.className += ' on';
        }
    }

    displayListItems(dataList) {
        let shouldColorDifferent = false;
        for (const url of dataList) {
            const entry = <div class={'entry' + (shouldColorDifferent ? ' contrast' : '')}></div>;           
            
            const toggleButtonClass = 'toggle';
            const toggleButton = <button class={toggleButtonClass}>{this.fileNameToName(url)}</button>;
            const browseButton = <button>browse</button>
            const editButton = <button>edit</button>
            const input = <input class="options"></input>;
            
            
            toggleButton.addEventListener('click', e => {
                // as objects get serialized and deserialized we cannot use includes
                const itemIndex = this.selectedItems.findIndex(obj => obj.url === url);
                if (itemIndex !== -1) {
                    e.target.className = toggleButtonClass;
                    this.selectedItems.splice(itemIndex, 1);
                } else {
                    e.target.className += ' on';
                    this.selectedItems.push({url: url, options: eval(input.value)});
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
            
            
            this.pluginListElement.appendChild(entry);
            shouldColorDifferent = !shouldColorDifferent;
        }
    }

    /*MD # Search Plugins MD*/

    get searchRoots() {
        if (!this._roots) {
            this._roots = lively.preferences.get("ExtraSearchRoots")
        }
        return this._roots
    }

    async getFiles() {
        var result = [];
        await FileIndex.current().db.files.each(file => result.push(file));
        return result;
    }

    async fetchListData() {
        var search = new RegExp(pluginPrefix, 'ig');

        const filteredFiles = (await this.getFiles()).filter(file => {
            if (file.url.startsWith(lively4url)) {
                const relativePath = file.url.replace(/.*\//ig, '');
                return relativePath.match(search);
            } else {
                var inSearchRoot = this.searchRoots.find(ea => file.url.startsWith(ea))
                if (inSearchRoot) {
                    const relativePath = file.url.replace(/.*\//ig, '');
                    return relativePath.match(search);
                }
                return false;
            }
        });

        return filteredFiles;
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
