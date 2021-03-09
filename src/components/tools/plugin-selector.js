import FileIndex from "src/client/fileindex.js";
import Morph from 'src/components/widgets/lively-morph.js';

const dataUrl = '/src/components/tools/plugin-selector-list.json';

export default class PluginSelector extends Morph {
    async initialize() {
        this.windowTitle = "PluginSelector";
        this.registerButtons()

        lively.html.registerKeys(this); // automatically installs handler for some methods

        // when created by the plugin explorer it will set this property or we already know it after migration
        this._pluginExplorer = this._pluginExplorer || null;

        this.listData = await this.fetchListData();
        this.displayListItems(this.listData);

        this.selectedItems = [];
        this.restoreSelection();
    }
    
    get workspace() {
        return this.pluginExplorer ? this.pluginExplorer.workspace : null;
    }

    get pluginExplorer() {
        return this._pluginExplorer;
    }

    /*MD ## UI access MD*/

    set pluginExplorer(value) {
        this._pluginExplorer = value;
        this.restoreSelection();
    }

    get pluginListElement() {
        return this.get('#pluginList');
    }
    
    get selectedPluginsElement() {
        return this.get('#selectedPlugins');
    }
    
    get activateListElement() {
        return this.get('#activate');
    }
    
    get browseListElement() {
        return this.get('#browse');
    }
    
    get editListElement() {
        return this.get('#edit');
    }
    
    /*MD ## Utility MD*/

    fileNameToName(string) {
        return string.split('/').last;
    }

    listElementTo(string, list) {
        // last element is the addElement button => ignore it
        const nodes = Array.from(this.activateListElement.childNodes).slice(0, -1)
        return nodes[list.indexOf(string)];
    }
    
    
    /*MD ## UI interaction MD*/

    restoreSelection() {
        if (!this.listData || !this.workspace) {
            return;
        }
        const list = this.listData.map(url => this.fileNameToName(url));
        this.selectedItems = this.workspace.pluginSelection;
        for (const { url } of (this.selectedItems || [])) {
            const button = this.listElementTo(this.fileNameToName(url), list);
            button.className += ' on';
        }
        
        this.updatedSelection();
    }
    
    updatedSelection() {
        this.selectedPluginsElement.innerHTML = `
          <div id="activePlugins" class="container"></div>
          <div id="ups" class="container"></div>
          <div id="downs" class="container"></div>
          <div id="inputs" class="container"></div>
`;
        
        const urls = this.selectedItems.map(x => x.url)
        
        for(let i = 0; i < urls.length; i++) {
            const info = <button style="background: #fff; border: 1px solid black">{this.fileNameToName(urls[i])}</button>;
            const upButton = <button disabled={i === 0 ? true : false}><i class="fa fa-chevron-up"></i></button>;
            const downButton = <button disabled={i === urls.length-1 ? true : false}><i class="fa fa-chevron-down"></i></button>;
            const input = <input style="margin: 5px" class="unmodified"></input>
            this.get('#activePlugins').appendChild(info);
            this.get('#ups').appendChild(upButton);
            this.get('#downs').appendChild(downButton);
            this.get('#inputs').appendChild(input);
            
            upButton.addEventListener('click', e => {
                if(i === 0) { return; }
                
                const tmp = this.selectedItems[i-1];
                this.selectedItems[i-1] = this.selectedItems[i];
                this.selectedItems[i] = tmp;
                this.pluginExplorer.savePluginSelection(this.selectedItems);
                this.updatedSelection();
            });
            
            downButton.addEventListener('click', e => {
                if(i === urls.length-1) { return; }
                
                const tmp = this.selectedItems[i+1];
                this.selectedItems[i+1] = this.selectedItems[i];
                this.selectedItems[i] = tmp;
                this.pluginExplorer.savePluginSelection(this.selectedItems);
                this.updatedSelection();
            });
            
            input.addEventListener('keydown', e => {
                input.className = 'modified';
                
                if(e.ctrlKey && e.key === 's') {
                    input.className = 'unmodified';
                    if(input.value !== '') {
                        this.selectedItems[i].data = input.value;
                    } else {
                        delete this.selectedItems[i].data;
                    }
                    
                    this.pluginExplorer.savePluginSelection(this.selectedItems);
                }
            })
        }
    }

    appendEntriesFor(url) {
        const toggleButtonClass = 'toggle';
        const toggleButton = < button class = { toggleButtonClass } title={url}> { this.fileNameToName(url) } < /button>;
        const browseButton = < button> browse < /button>
        const editButton = < button> edit < /button>


        toggleButton.addEventListener('click', e => {
            // as objects get serialized and deserialized we cannot use includes
            const itemIndex = this.selectedItems.findIndex(obj => obj.url === url);
            if (itemIndex !== -1) {
                e.target.className = toggleButtonClass;
                this.selectedItems.splice(itemIndex, 1);
            } else {
                e.target.className += ' on';
                this.selectedItems.push({ url: url });
            }
            this.updatedSelection();
            this.pluginExplorer.savePluginSelection(this.selectedItems);

        });

        browseButton.addEventListener('click', e => {
            lively.openBrowser(lively4url + '/' + url, true);
        })

        editButton.addEventListener('click', e => {
            this.pluginExplorer.changeSelectedPlugin(url);
        })

        this.activateListElement.appendChild(toggleButton);
        this.browseListElement.appendChild(browseButton);
        this.editListElement.appendChild(editButton);
        
    }

    displayListItems(dataList) {
        this.pluginListElement.innerHTML = `
          <div id="activate" class="container"></div>
          <div id="browse" class="container"></div>
          <div id="edit" class="container"></div>
        `;             
        
        for (const url of dataList) {
            this.appendEntriesFor(url);
        }

        const entry = <div></div>;
              
        entry.appendChild(<button > Add Element </button>);

        entry.addEventListener('click', async (_) => {
            let urls = await lively.files.chooseFiles(lively4url + "/");
            urls = urls.map(url => url.replace(lively4url + '/', ''));
            this.listData.push(...urls);
            this.listData.sort();
            this.saveListData();
            this.displayListItems(this.listData);
        })

        this.activateListElement.appendChild(entry);
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
        const contents = JSON.stringify(this.listData, undefined , 2);
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
        this._pluginExplorer = other._pluginExplorer;

    }

    livelyInspect(contentNode, inspector) {
        // do nothing
    }

}
