import Morph from 'src/components/widgets/lively-morph.js';
import files from 'src/client/files.js';
import * as componentLoader from 'src/client/morphic/component-loader.js';

export default class ComponentBin extends Morph {
  async initialize() {
    this.windowTitle = "Component Bin"
    this.categories = new Set()
    
    var compList = await this.loadComponentList()
    await this.createTiles(compList);
    this.showTiles(this.sortAlphabetically(this.componentList));
    
    this.updateCategories()
    
    this.searchField = this.get("#search-field");
    this.searchField.addEventListener('keyup', (e) => { this.searchFieldChanged(e) });
    this.searchField.addEventListener('focus', (e) => { e.target.select(); });
    
    this.searchField.focus()
    // this.showCategory("tools")  
  }

  onSelectCategory(category) {
    this.showCategory(category)  
  }

  showCategory(category) {
    var ul = this.get("#categories")
    ul.querySelectorAll("li").forEach(ea => ea.classList.remove("selected"))
    
    var li = ul.querySelector(`li[name="${category}"]`)
    if (li) {
      li.classList.add("selected")
    }
    
    
    for(let tile of this.shadowRoot.querySelectorAll("lively-component-bin-tile")) {
      if (tile.config.category == category) {
        tile.style.display = ""
      } else {
        tile.style.display = "none"
      }
    }
  }

  updateCategories() {
    var ul = this.get("#categories")
    ul.innerHTML = ""
    for(let category of Array.from(this.categories).sort()) {
      let li = <li>{category}</li>
      li.setAttribute("name", category)
      li.addEventListener("click", evt => {
        this.onSelectCategory(category)
      })
      ul.appendChild(li)
    }
    
  }
  
  
  async loadComponentList() {
    var paths =  lively.components.getTemplatePaths()
      .filter(ea => !ea.match(/\/draft/))
      .filter(ea => !ea.match(/\/halo/))
      // .filter(ea => !ea.match(/\/widgets/))

    var result  = []
    for(let templatesUrl of paths) {
      await files.statFile(templatesUrl).then(response => {
        try {
          // depending in the content type, the response is either parsed or not,
          // github always returns text/plain
          result.push(...JSON.parse(response).contents.filter(file => {
              return file && file.type === "file" && file.name.match(/\.html$/);
            }).map(file => {
              var directory = templatesUrl.replace(/\/$/,"")
                      return {
              "name": file.name.replace(/\.html$/,"")
                .replace(/lively-/,"").replace(/-/g," "),
              "html-tag": file.name.replace(/\.html$/,""),
              "description": "",
              "author": "",
              "date-changed": "",
              "categories": ["default"],
              "category": directory.replace(/.*\//,""),
              "tags": [],
              "directory": directory,
              "template": file.name}
            }))
        } catch (e) {
          // it was already json
        }
      })
    }
    
    return result
  }

  async createTiles(compList) {
    this.componentList = []
    for(let compInfo of compList) {
      this.categories.add(compInfo["category"])
      var tile = await lively.create("lively-component-bin-tile", this);
      tile.setBin(this);
      tile.configure(compInfo);
      compInfo.tile = tile;
      this.componentList.push(compInfo)
    }
  }

  showTiles(filteredCompList) {
    var list = this.getSubmorph(".tile-pane");

    // remove all tiles
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    filteredCompList.forEach((compInfo) => {
      list.appendChild(compInfo.tile);
    });
  }

  inWindow() {
    return this.getSubmorph("#open-in-checkbox").checked;
  }

  searchFieldChanged(evt) {
    var subList = this.findByName(this.searchField.value);
    subList = this.sortAlphabetically(subList);

    this.showTiles(subList);
  }

  sortAlphabetically(compList) {
    return compList.sort((a, b) => {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
  }

  findByName(string) {
    if (!this.componentList) return []
    return this.componentList.filter((comp) => {
      return comp.name.toLowerCase().indexOf(string.toLowerCase()) >= 0;
    });
  }
  
  close() {
    if (this.parentElement && this.parentElement.isWindow) {
      this.parentElement.remove()
    }
  }
  
}
