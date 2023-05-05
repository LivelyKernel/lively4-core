
/*MD # ComponentBin

Keywords: #Tool #Core #Lively4

Authors: #SeminarProject #JensLincke

![](lively-component-bin.png)

MD*/
import Morph from 'src/components/widgets/lively-morph.js';
import files from 'src/client/files.js';
import ComponentLoader from 'src/client/morphic/component-loader.js';
import FileIndex from 'src/client/fileindex.js'

export default class ComponentBin extends Morph {
  async initialize() {
    this.windowTitle = "Component Bin"
    this.categories = new Set()
    this.allCategory = "-- all --"
    this.modifiedCategory = "-- modified --"
    this.sizeCategory = "-- size --"
    this.separatorCategory = "---"

    var compList = await this.loadComponentList()
    await this.createTiles(compList);
    this.showTiles(this.sortAlphabetically(this.componentList));

    this.updateCategories()

    this.searchField = this.get("#search-field");
    this.searchField.addEventListener('keyup', (e) => { this.searchFieldChanged(e) });
    this.searchField.addEventListener('focus', (e) => { e.target.select(); });

    this.searchField.focus()
    // this.showCategory("tools")  

    this.addEventListener("paste", evt => this.onPaste(evt), true);

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
  
    var tileList = this.get("#tiles")
    var tiles = Array.from(tileList.querySelectorAll("lively-component-bin-tile"))

    if (category === this.modifiedCategory) {
      tiles = tiles.sortBy(ea => ea.config.fileInfo && ea.config.fileInfo.modified).reversed()
      tiles.forEach(ea => ea.setInfo(ea.config.fileInfo && ea.config.fileInfo.modified))
    } else if (category === this.sizeCategory) {
      tiles = tiles.sortBy(ea => ea.config.fileInfo && ea.config.fileInfo.content.length).reversed()
      tiles.forEach(ea => {
        let sizeString = ""
        if (ea.config.fileInfo) {
           sizeString += (Math.round(ea.config.fileInfo.size / 1024) + "kb")
           sizeString += " " +(Math.round(ea.config.fileInfo.content.split("\n").length) + " LoC") // #TODO cache LOC 
          
        }
        ea.setInfo(sizeString)
      })
    } else {
      tiles = tiles.sortBy(ea => ea.config.name)
      tiles.forEach(ea => ea.setInfo(""))
    }
    tileList.innerHTML = ""
    for (let tile of tiles) {
      if (tile.config.categories.includes(category)) {
        tile.style.display = ""
      } else {
        tile.style.display = "none"
      }
      tileList.appendChild(tile)
    }
  }

  updateCategories() {
    var ul = this.get("#categories")
    ul.innerHTML = ""
    let categories =  Array.from(this.categories).sort().filter(ea => ea)
    
    
    let keywordCategories = categories.filter(ea => ea.match(/^#/))
    let otherCategories = categories.filter(ea => !ea.match(/^#/) && !ea.match(/^--/))
    categories = [this.allCategory, this.modifiedCategory, this.sizeCategory]
      .concat(otherCategories)
      .concat([this.separatorCategory])
      .concat(keywordCategories)
    
    
    for (let category of categories) {
      let count = this.componentList.filter(ea => ea.categories.includes(category)).length
      let li = <li> { category } <span style="color:gray; font-size:10pt">({count})</span></li>
      if (category === this.separatorCategory) {
        li = <li>----------</li>
      } else {        
        li.setAttribute("name", category)
        li.addEventListener("click", evt => {
          this.onSelectCategory(category)
        })
      }  
        
      ul.appendChild(li)
    }

  }

  // #important
  async loadComponentList() {
    var paths = lively.components.getTemplatePaths()
      .filter(ea => !ea.match(/\/draft/))
      .filter(ea => !ea.match(/\/halo/))
      .filter(ea => !ea.match(/\/pen-editor/))
      .filter(ea => !ea.match(/\/src\/client\/vivide\//))
    
    // .filter(ea => !ea.match(/\/widgets/))

    var result = []
    for (let templatesUrl of paths) {
      let response = await files.statFile(templatesUrl)
      // depending in the content type, the response is either parsed or not,
      // github always returns text/plain

      let templateFiles = JSON.parse(response).contents.filter(file => {
        return file && file.type === "file" && file.name.match(/\.html$/)
      })
      let fileInfos = await FileIndex.current().db.files.where("url").startsWith(templatesUrl).toArray()

      for (let file of templateFiles) {
        try {
          // console.log("ComponentBin add " + file.name)
          var templateURL = templatesUrl + file.name
          var componentURL = templateURL.replace(/\.html$/, ".js")
          var fileInfo = fileInfos.find(ea => ea.url == componentURL)
          var keywords = []
          
          console.log("componentURL " + componentURL)
                    
          if (fileInfo && fileInfo.keywords) {
            keywords = fileInfo.keywords // .map(ea => ea.replace(/^#/,""))
          }
          
          var directory = templatesUrl.replace(/\/$/, "")
          let directoryCategory = directory.replace(lively4url, "").replace("/src/", "")
              .replace(/^\/templates/, "Templates")
              .replace(/^\/demos/, "demos")
              .replace(/babylonian-programming-editor.*/, "Babylonian")
              .replace(/client\/reactive\/components.*/, "Reactive")
              .replace(/components\/d3/, "D3")
              .replace(/components\/widgets/, "Widgets")
              .replace(/components\/tools/, "Tools")
              .replace(/demos\/.*/, "Demos")
              .replace(/components\/demo/, "Demos")
          
          
          let categories =               
              [this.allCategory]
                .concat(keywords)
                .concat([directoryCategory])

          if (fileInfo) {
            categories.push(this.modifiedCategory) // #TODO some templates do not have a js component 
            categories.push(this.sizeCategory)
          }
          
          
          result.push({
            "name": file.name.replace(/\.html$/, "")
              .replace(/lively-/, "").replace(/-/g, " "),
            "html-tag": file.name.replace(/\.html$/, ""),
            "description": "",
            "date-changed": "",
            "categories": categories,
            "tags": [],
            directory,
            "fileInfo": fileInfo,
            "stats": file,
            componentURL,
            templateURL,
            "template": file.name
          })
        } catch (e) {
          debugger
          console.log("ComponentBin ERROR loading " + file.name )
        }
      }  
    }

    return result
  }

  async createTiles(compList) {
    this.componentList = []
    for (let compInfo of compList) {
      this.categories.add(compInfo["category"])
      for(let category of compInfo.categories) {
        this.categories.add(category)
      }
      let tile = await lively.create("lively-component-bin-tile", this);
      tile.setBin(this);
      tile.configure(compInfo);
      compInfo.tile = tile;

      let info = compInfo
      tile.addEventListener("click", () => this.onSelectTile(tile, info))

      this.componentList.push(compInfo)
    }
    this.categories.add(this.allCategory)
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

  onSelectTile(tile, compInfo) {
    this.currentComponentInfo = compInfo
    this.currentComponentTile = tile
    this.get("#info").innerHTML = ""
    this.get("#info").appendChild( <div>
        <div> Name: <b> { compInfo.name } </b></div >
        <button click={() => lively.openInspector(compInfo) }>inspect</button>
        <a click={() => lively.openBrowser(compInfo.directory + "/" + compInfo["html-tag"] + ".js", true) }> source </a>
        <a click={() => lively.openBrowser(compInfo.directory + "/" + compInfo["html-tag"] + ".png", true) } > image </a>
        <a click={() => lively.openSearchWidget(compInfo["html-tag"]) }>search</a>
        {compInfo.fileInfo && compInfo.fileInfo.authors ? <div>Authors: {compInfo.fileInfo.authors}</div> : ""}
        {compInfo.fileInfo && compInfo.fileInfo.keywords ? <div>Keywords: {compInfo.fileInfo.keywords}</div> : ""}
      </div>)
    }

    async onPaste(evt) {
      if (!this.currentComponentInfo) return
      var dataTransfer = evt.clipboardData

      lively.notify("paste")

      evt.stopPropagation();
      evt.preventDefault();
      var items = dataTransfer.items;
      if (items.length > 0) {
        for (var index in items) {
          var item = items[index];
          if (item.kind === 'file' && item.type == "image/png") {
            var file = item.getAsFile()
            var filename = this.currentComponentInfo.directory + "/" + this.currentComponentInfo["html-tag"] +
              ".png"
            lively.notify("write " + filename)
            var dataURL = await files.readBlobAsDataURL(file)
            var blob = await fetch(dataURL).then(r => r.blob())
            if (await lively.files.exists(filename)) {
              if (!await lively.confirm("overwrite " + filename)) {
                lively.warn("canceled")
                return
              }
            }
            await files.saveFile(filename, blob)
            ComponentLoader.resetTemplatePathCache()
            this.currentComponentTile.setThumbnail(filename)
            lively.showElement(this.currentComponentTile).textContent = ""
            lively.notify("wrote " + filename)
            return true
          }
        }
      }
      // lively.notify("paste: " + evt.clipboardData.getData('image/png')) 
    }


  }
