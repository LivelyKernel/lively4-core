import ContextMenu from 'src/client/contextmenu.js';
import Morph from 'src/components/widgets/lively-morph.js';
import focalStorage from 'src/external/focalStorage.js'


export default class MovieListing extends Morph {
  
  initialize() {
    this.get("#search").addEventListener("keyup", (evt) => { 
      if(evt.key == "Enter") { 
        this.onSearch(this.get("#search").value); 
      }
    })
  }
  
  attachedCallback() {
    this.get("#content").innerHTML = ""
    var container = lively.query(this, "lively-container");
    this.createView(container).then(view => {
      this.get("#content").appendChild(view)
    })
  }
  
  get moviesSrc() {
    return this.getAttribute("movies") 
  }
  
  get selectedMoviesSrc() {
    return this.getAttribute("selected") ||  "selected_movies"
  }
  
  get playlistSrc() {
    return this.getAttribute("playlists") ||  "_playlists"
  }
  
  bag(key, map, object) {
    let bag = map.get(key) || []
    bag.push(object)
    map.set(key, bag)
  }
  
  async createView(container) {

    this.directory = container.getDir();
    // "cached://" +
    var listSource = await fetch(this.directory + "/" + this.moviesSrc).then(r => r.text())
    this.selectedMoviesURL = this.directory + "/" + this.selectedMoviesSrc
    this.playlistsURL = this.directory + "/" + this.playlistSrc

    

    await this.loadSelectedMovies()
    await this.loadPlaylists()
    
    var files  = listSource.split("\n").map(ea => {
      try {
        return JSON.parse(ea)
      } catch(e) {
        return null
      }
    }).filter(ea => ea)

    var noidcounter = 0
    for(let file of files) {
      if (!file.imdb) {
            file.imdb = "noid" + noidcounter++
      }
      file.shortName = file.filename.replace(/.*\//,"").replace(/\].*/,"]") 
      if (!file.title) {
        file.title = file.shortName.replace(/\[.*/,"")
        file.genre = "n/a"
        file.actors = ""
        file.director = ""
        file.extract_year = file.year
        file.rating  = "n/a"
        file.noposter = true
      }
    }
    
    
    var movies = files
        .map(ea => ea.imdb)
        .uniq().map(ea => {
          var all =files.filter(file => file.imdb == ea)
          var first = all[0]
          first.files = all
          return first
        })
        .filter(ea => ea.year)

    this.genres = new Map()
    this.collections = new Map()
    this.playlists = new Map()
    this.ratings = new Map()
    this.directors = new Map()
    this.actors = new Map()
    
    
    for(let movie of movies) {
      for(let genre of (movie.genre || "").split(/, /)) {
        this.bag(genre, this.genres, movie)
      }
      if (movie.filename.match(/\//)) {
        var collection = movie.filename.replace(/\/.*/,"")
      } else {
        collection = "none"
      }
      this.bag(collection, this.collections, movie)
      
      

      for (let playlistName of this.playlistsSets.keys()) {
        var set  = this.playlistsSets.get(playlistName)
        if (set.has(movie.shortName)) {
           this.bag(playlistName, this.playlists, movie)
        }
      }
      
      
      var rating = new Number(movie.rating || 0)
      rating = Math.floor(rating)
      this.bag("" + rating, this.ratings, movie)
      
      for(let director of (movie.director || "").split(/, /)) {
        this.bag(director, this.directors, movie)
      }
      for(let actor of (movie.actors || "").split(/, /)) {
        this.bag(actor, this.actors, movie)
      }

    }

  this.serverURL = lively.files.serverURL(this.directory)
          // does only make sense when accessing a localhost server, 
          // otherwise a pdf viewer would be opened on a remote machine?


  this.movieItems = movies.map(movie => {
        var title = <a class="title" click={() => {
            lively.openInspector(movie)
          }}></a>
        title.innerHTML = movie.files[0].title // contains HTML


        if (movie.year == movie.extract_year) {
          var year = <span class="year">({movie.year})</span> 
        } else {
          year = <span class="year conflict">({movie.extract_year})</span> 
        }

        var item =  <div class="movie" click={() => this.onMovieItemClick(movie, item)}>
          <div class="poster">
          <img src={movie.noposter ?
                this.directory + "_imdb_/noposter.jpg" :
                this.directory + "_imdb_/posters/" + movie.imdb+ ".jpg"}
            click={() => window.open("https://www.imdb.com/title/" + movie.imdb)}
          ></img>
          </div>
          {title} 
          {year}
          <span class="rating">({movie.rating})</span> 
          <br />
          <span class="genre">{movie.files[0].genre || ""}</span>
          {... movie.files.map(file => {
            var checkbox = <input class="checkbox" type="checkbox"></input>
            if (this.selectedMovies.has(file.filename)) {
              checkbox.checked = true
            }

            checkbox.addEventListener("click", evt => this.selectFile(file, checkbox))

            var fileItem = <div class="file">{checkbox}<a click={() => {
              this.playFile(file)
            }}>{file.filename.replace(/.*\//,"")}</a></div>
            fileItem.addEventListener('contextmenu',  evt => {
              if (!evt.shiftKey) {
                evt.stopPropagation();
                evt.preventDefault();
                var title = file.shortName.replace(/ \[.*/,"") 
                var menu = new ContextMenu(fileItem, [
                      ["open", () => this.playFile(file)],
                      [`rename`, () => container.renameFile(this.directory + file.filename, false)],
                      [`search imdb`, async () => {
                        var searchURL = "https://www.imdb.com/find?q=" + title.replace(/ /g, "+")
                        var comp = document.body.querySelector("#ImdbSearchFrame")
                        if (!comp) {
                            comp = await lively.openComponentInWindow("lively-iframe")
                            comp.id = "ImdbSearchFrame"
                        }
                        comp.setURL(searchURL)
                      }],
                      [`fix search`, async () => {
                        var urlOrId = await lively.prompt("Enter IMDB id or url")  
                        
                        // https://www.imdb.com/title/tt0007162/?ref_=fn_al_tt_1
                        
                        var id =  urlOrId.replace(/.*title\//,"").replace(/\/.*/,"")
                        if (!id.match(/^tt\d\d+/)) {
                          lively.warn("could not find IMDB id in ", urlOrId)
                          return
                        }
                        lively.success("found id: " + id)
                        var data = await this.searchOmdbById(id)
                        var targetURL = this.directory + "/_imdb_/search/" + title+ ".json"
                        await lively.files.saveFile(targetURL, JSON.stringify(data,null,2))
                        lively.openBrowser(targetURL, true)
                      }],
                    ]);
                menu.openIn(document.body, evt, fileItem);
                return true;
              }

            }, false);

            return fileItem

          })}
        </div>

        item.movie = movie
        return item
      });
    this.currentMovieItems = this.movieItems


    this.pane = <div class="movies">
      {...this.movieItems}
      </div>

    this.currentReverse=false

    this.navbar = container.get("lively-container-navbar")
    this.navbarDetails = this.navbar.get("#details")
    this.navbarDetails.querySelector("ul").innerHTML = "" // #TODO, be nicer to other content?
    
    this.createNavbarItem("Filter", 1)    
    
    this.createSelectedMoviesFilter()
    this.createConflictingYearMoviesFilter()
    this.createShowAllMoviesFilter()

    
    this.createFilters("Genre", this.genres)    
    this.createFilters("Collections", this.collections)
    this.createFilters("Playlists", this.playlists)

    this.createFilters("Ratings", this.ratings, {reverse: true})
    this.createFilters("Director", this.directors, {
      filter: name => this.directors.get(name).length > 2,
      sortBy: name => this.directors.get(name).length,
      reverse: true
    })
    this.createFilters("Actors", this.actors, {
      filter: name => this.actors.get(name).length > 2,
      sortBy: name => this.actors.get(name).length,
      reverse: true
    })
    
    
    var view = <div>
      <div>
        <button click={() => this.sortByYear()}>by year</button>
        <button click={() => this.sortByRating()}>by rating</button>
        <button click={() => this.sortByTitle()}>by title</button>
        <button click={() => this.deselectAll()}>deselect all</button>
        <span>playlist</span>
        <button click={() => this.addToPlaylist()}>add</button>
        <button click={() => this.removeFromPlaylist()}>remove</button>
      </div>
      {this.pane}
    </div>
    view.model = this
    return view
  }
  
  onMovieItemClick(movie, item) {
    if(this.currentMovieItem && this.currentMovieItem.classList.contains("selected")) {
      this.currentMovieItem.classList.remove("selected")
    }
    let details = this.get("#details")
    if(this.currentMovieItem == item) {
      this.currentMovieItem = null;
      details.style.display = "none"      
    } else {
      this.currentMovieItem = item;
      item.classList.add("selected")
      details.style.display = "block"
      lively.setGlobalPosition(details, lively.getGlobalBounds(item).bottomLeft())
      details.innerHTML = ""
      details.appendChild(<div>
          <div class="actors">actors: {
              ...movie.actors.split(", ")
                .map(ea => <a class="actor" 
                             click={() => this.filter(ea, this.actors, "Actors")}>{ea}</a>)
                .joinElements((a,b) => new Text(", "))}
          </div>
          <div class="directors">director: {
              ...movie.director.split(", ")
                .map(ea => <a class="director" 
                             click={() => this.filter(ea, this.directors, "Directors")}>{ea}</a>)
                .joinElements((a,b) => new Text(", "))}
          </div>
      </div>)
    }
  
  }
  
  async loadPlaylists() {
    
    var base = this.playlistsURL
    var stats = await fetch(base, {method: "OPTIONS"}).then(r => r.json())
    
    this.playlistsSets = new Map()
    for (let file of stats.contents) {
      var url = base + "/" + file.name
      this.playlistsSets.set(file.name, await this.loadMovieSet(url))
    }
  }
  
  async loadMovieSet(url) {
    var resp = await fetch(url)
    if (resp.status == 200) {
      try {
        var source = await resp.text()
        return new Set(source.split("\n")) 
      } catch(e) {
        lively.error("Error loading movies set ", e)
      }
    } else {
        lively.notify("could not load movie set")
    }
    return new Set()
  }
  
  async loadSelectedMovies() {
    this.selectedMovies = await this.loadMovieSet(this.selectedMoviesURL)
  }
  
  
  toggleFilters(expandButton, className) {
    if (expandButton.textContent == "+") {
      expandButton.textContent = "-"
      for(let ea of this.navbarDetails.querySelectorAll("." + className)) {
        ea.style.display = "block" 
      }
    } else {
      expandButton.textContent = "+"
      for(let ea of this.navbarDetails.querySelectorAll("." + className)) {
        ea.style.display = "none"
      }
    }
  }
  
  createFilters(name, groups, options={}) {
    var action = ea => this.filter(ea, groups, name)
    var nameList = Array.from(groups.keys()).sort()
    if (options.filter) nameList = nameList.filter(options.filter)
    if (options.sortBy) nameList = nameList.sortBy(options.sortBy)
    if (options.reverse) nameList = nameList.reverse()
    var item = this.createNavbarItem(name, 1)
    var className =  name + "Filter"
    var expandButton = <span click={() => this.toggleFilters(expandButton, className)}>-</span>
    item.childNodes[0].appendChild(<span> {expandButton}</span>)
    for(let ea of nameList) {
      var bag = groups.get(ea)
      let li = this.createFilter(bag, ea, action)
      li.addEventListener('contextmenu',  evt => {
              if (!evt.shiftKey) {
                evt.stopPropagation();
                evt.preventDefault();
                var menuitems = []
                if (name == "Playlists") {
                  menuitems.push(["show missing", () => {
                    var names = this.playlists.get(ea).map(ea => ea.shortName)
                    var missing = Array.from(this.playlistsSets.get(ea)).filter(ea => !names.includes(ea))
                    lively.openWorkspace(missing.join("\n"))
                  }])
                }
                
                var menu = new ContextMenu(li, menuitems );
                menu.openIn(document.body, evt, li);
                return true;
              }

            }, false);
      
      li.classList.add(className)
    }
  }
  
  createNavbarItem(name, level=1) {
    var detailsItem = this.navbar.createDetailsItem(name)
    detailsItem.classList.add("subitem")
    detailsItem.classList.add("level" + level)
    this.navbarDetails.querySelector("ul").appendChild(detailsItem)
    return detailsItem
  }
  
  deselectAll() {
    this.selectedMovies = new Set()
    this.saveSelectedMovies()
  }
  
  async modifyPlayList(name,operation="add") {
    var url = this.playlistsURL + "/" + name

    var set = this.playlistsSets.get(name) || new Set()   
    for(var ea of this.selectedMovies) {
      var short = ea.replace(/.*\//,"").replace(/\.[a-z]{3}$/,"").replace(/\].*/,"]")
      set[operation](short)
    }
    var newSource =  Array.from(set).sort().join("\n") + "\n"
    await lively.files.saveFile(url, newSource)
  }
  
  
  async addToPlaylist() {
    var name = await lively.prompt("Playlist name","playlist")
    await this.modifyPlayList(name,"add")
    lively.notify("added to movies to playlist", name)
  }
  
  async removeFromPlaylist() {
    var name = await lively.prompt("Playlist name","playlist")
    await this.modifyPlayList(name,"delete")
    lively.notify("removed movies from playlist", name)
  }
  
  
  playFile(file) {
    var url = this.directory + "/"+ encodeURI(file.filename)
    let playPath = url.replace(this.serverURL,"").replace(/^\//,"")
    var openURL = this.serverURL + "/_open/" + playPath 
    lively.notify("open " + openURL)
    fetch(openURL)
  }

  async selectFile(file, checkbox) {
    if (checkbox.checked) {
      this.selectedMovies.add(file.filename)
    } else {
      this.selectedMovies.delete(file.filename)
    }
    this.saveSelectedMovies()
  }
  

  async saveSelectedMovies() {
    var newSource = Array.from(this.selectedMovies).sort().join("\n") + "\n"
    await lively.files.saveFile(this.selectedMoviesURL, newSource)
    lively.notify("updated  selected movies")
  }

  
  createFilter(bag, name, action) {
    var detailsItem = this.createNavbarItem(name + " (" + bag.length+")", 2)
    detailsItem.addEventListener("click", () => action(name))
    return detailsItem
  }

  hideDetails() {
    var detials = this.get("#details")
    detials.style.display = "none"
  }

  // #important
  filter(name, map, filterName) {
    this.hideDetails()
    this.get("#filters").innerHTML = ""
    this.get("#filters").appendChild(<span>{name} ({filterName})</span>)
    var movies = map.get(name)
    this.setCurrentMovieItems(this.movieItems
      .sortBy(ea => ea.movie.year)
      .reverse()
      .filter(ea => movies.includes(ea.movie)))
  }

  sortByYear() {
    if (this.lastSort == "year") {
      this.currentReverse = !this.currentReverse
    } else {
      this.currentReverse = true
    }
    this.lastSort = "year"
    this.sortBy(ea => ea.movie.year, this.currentReverse)
  }

  sortByRating() {
    if (this.lastSort == "rating") {
      this.currentReverse = !this.currentReverse
    } else {
      this.currentReverse = true
    }
    this.lastSort = "rating"
    this.sortBy(ea => Number(ea.movie.rating) || 0 , this.currentReverse) 
  }
  
  sortByTitle() {
    if (this.lastSort == "title") {
      this.currentReverse = !this.currentReverse
    } else {
      this.currentReverse = false
    }
    this.lastSort = "title"
    this.sortBy(ea => ea.movie.title , this.currentReverse) 
  }
  
  sortBy(func, reverse) {
      this.pane.innerHTML = ""
      let items = this.currentMovieItems.sortBy(func)
      if(reverse) {
        items = items.reverse()
      }
      items.forEach(ea => {
        this.pane.appendChild(ea)
      })
  }
  
  setCurrentMovieItems(items) {
    this.currentMovieItems = items
    this.pane.innerHTML = ""
    this.currentMovieItems.forEach(ea => {
        this.pane.appendChild(ea)
      })
  }

  createSelectedMoviesFilter() {
    var detailsItem = this.createNavbarItem("_selected", 2)
    detailsItem.addEventListener("click", () => this.filterSelected())
  }
  
  filterSelected() {
    this.setCurrentMovieItems(this.movieItems
        .sortBy(ea => ea.movie.year)
        .reverse()
        .filter(ea => {
          return ea.movie.files.find(file => this.selectedMovies.has(file.filename))
    }))
  }
  
  filterConflictingYear() {
    this.setCurrentMovieItems(this.movieItems
      .sortBy(ea => ea.movie.year)
      .reverse()
      .filter(ea => ea.movie.year != ea.movie.extract_year))
  }
  
  showAllMovies() {
    this.setCurrentMovieItems(this.movieItems
      .sortBy(ea => ea.movie.filename)
      .reverse())
  }
  
  createConflictingYearMoviesFilter() {
    var detailsItem = this.createNavbarItem("_conflicting", 2)
    detailsItem.addEventListener("click", () => this.filterConflictingYear())
  }
  
  createShowAllMoviesFilter(){
    var detailsItem = this.createNavbarItem("_all", 2)
    detailsItem.addEventListener("click", () => this.showAllMovies())
  }
  
  onSearch(string) {
    this.hideDetails()
    this.get("#filters").innerHTML = ""
    this.get("#filters").appendChild(<span>search: {string}</span>)
    this.setCurrentMovieItems(this.movieItems
      .filter(ea => ea.movie.title.match(string)))
  }

  async searchOmdbById(id) {
    return this.searchOmdb("i=" + id)
  }
  
  async searchOmdb(search) {
    var omdbapikey = await focalStorage.getItem("lively_omdbapikey")
    if (!omdbapikey) {
      omdbapikey = await lively.prompt("Enter OMDB API key")
      await focalStorage.setItem("lively_omdbapikey", omdbapikey)
    }
    return fetch(`http://www.omdbapi.com/?apikey=${omdbapikey}&${search}`).then(r => r.json())
  }
  
  
}
